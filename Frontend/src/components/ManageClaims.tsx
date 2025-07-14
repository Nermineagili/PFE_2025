import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Table, Modal, Spinner, Alert, Container, Card, OverlayTrigger, Tooltip, Badge, Form } from "react-bootstrap";
import { FaRegTrashAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { FaBrain } from 'react-icons/fa'; // AI-themed icon
import { FaEye } from 'react-icons/fa'; // Icon for "Voir plus"
import "./ManageClaims.css";
import { useTheme } from "../context/ThemeContext";

interface Claim {
  _id: string;
  userId: { name: string; email: string; phone: string } | string | null;
  contractId: { policyType: string; startDate: string; endDate: string; status: string } | string | null;
  firstName: string;
  lastName: string;
  birthDate: { day: number; month: number; year: number };
  profession: string;
  phone: string;
  email: string;
  postalAddress: string;
  incidentType: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  damages: string;
  thirdPartyInvolved: boolean;
  thirdPartyDetails?: {
    name: string;
    contactInfo: string;
    registrationId: string;
    insurerContact: string;
  };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  supportingFiles: { publicId: string; url: string; fileName: string; fileType: string; uploadedAt: string }[];
  comments: { comment: string; supervisorId: { name: string; email: string }; createdAt: string }[];
  prediction?: string;
  probability_suspicieux?: number;
}

const calculateDaysSinceIncident = (incidentDate: string): number => {
  const incident = new Date(incidentDate);
  const now = new Date();
  if (isNaN(incident.getTime())) {
    console.warn("Invalid incident date, using 0 days.");
    return 0;
  }
  const diffMs = now.getTime() - incident.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

interface ApiResponse {
  success: boolean;
  message: string;
  data: Claim[];
}

interface UpdateClaimResponse {
  success: boolean;
  message: string;
  data: Claim;
}

const API_BASE_URL = "http://localhost:5000/api/supervisor/claims";
const FLASK_API_URL = "http://localhost:5001/predict";

const ManageClaims: React.FC = () => {
  const { currentTheme } = useTheme();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ prediction: string; probability_suspicieux: number; probability_valide: number } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null); // Track which claim is being deleted

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await axios.get<ApiResponse>(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error("Invalid API response format");
      }

      setClaims(response.data.data);
    } catch (err) {
      console.error("Error fetching claims:", err);
      setError("Failed to fetch claims.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const requestBody: { status: "approved" | "rejected"; comment?: string } = { status };
      if (status === "rejected" && comment.trim()) {
        requestBody.comment = comment;
      }

      const response = await axios.put<UpdateClaimResponse>(
        `${API_BASE_URL}/${id}`,
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setClaims(claims.map(claim =>
          claim._id === id ? { ...claim, status, comments: response.data.data.comments } : claim
        ));
        
        if (selectedClaim && selectedClaim._id === id) {
          setSelectedClaim({ ...selectedClaim, status, comments: response.data.data.comments });
        }
        
        setComment("");
      }
    } catch (error) {
      console.error("Error updating claim status:", error);
      alert("Failed to update claim status.");
    }
  };

  const deleteClaim = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this claim?")) return;
    setDeleting(id); // Set the deleting state for this specific claim

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000, // Increased to 20 seconds
      });

      setClaims(claims.filter(claim => claim._id !== id));
      if (selectedClaim && selectedClaim._id === id) {
        setShowModal(false);
        setSelectedClaim(null);
      }
    } catch (error) {
      console.error("Error deleting claim:", error);
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          setError("Request timed out. Please try again or check your connection.");
        } else if (error.response) {
          setError(`Failed to delete claim: ${error.response.status} - ${error.response.data.message || 'Server error'}`);
        } else {
          setError("Failed to delete claim due to a network error.");
        }
      } else {
        setError("An unexpected error occurred while deleting the claim.");
      }
    } finally {
      setDeleting(null); // Clear the deleting state
    }
  };

  const handleSeeMore = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowModal(true);
    setComment("");
    setAnalysisResult(null);
  };

  const handleAnalyze = async (claim: Claim) => {
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const transformedClaim = {
        combinedText: claim.incidentDescription || 'aucune description',
        incidentType: claim.incidentType || 'Other',
        profession: claim.profession || 'Other',
        policyType: typeof claim.contractId === 'string'
          ? (await axios.get(`http://localhost:5000/api/contracts/${claim.contractId}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(res => res.data.policyType))
          : 'Other',
        thirdPartyInvolved: claim.thirdPartyInvolved ? 1 : 0,
        supportingFilesCount: claim.supportingFiles ? claim.supportingFiles.length : 0,
        daysSinceIncident: calculateDaysSinceIncident(claim.incidentDate).toString(),
        isCompatible: 1,
        isDuplicate: 0,
        birthDate_year: claim.birthDate.year || 1980,
      };

      const response = await axios.post(FLASK_API_URL, { claim: transformedClaim }, {
        headers: { 'Content-Type': 'application/json' },
      });

      setAnalysisResult(response.data);

      await axios.post(
        `${API_BASE_URL}/analyze/${claim._id}`,
        { prediction: response.data.prediction, probability_suspicieux: response.data.probability_suspicieux },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error analyzing claim:', error);
      setError('Erreur lors de l\'analyse du sinistre.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge bg="success">Approuvé</Badge>;
      case "rejected":
        return <Badge bg="danger">Rejeté</Badge>;
      default:
        return <Badge bg="warning" text="dark">En attente</Badge>;
    }
  };

  const getUserIdDetails = (userId: Claim["userId"]) => {
    if (!userId || typeof userId === "string") return { name: "Unknown", email: "Unknown", phone: "Unknown" };
    return userId;
  };

  const getContractDetails = (contractId: Claim["contractId"]) => {
    if (!contractId || typeof contractId === "string") return { policyType: "Unknown", startDate: "N/A", endDate: "N/A", status: "N/A" };
    return contractId;
  };

  const formatDateFr = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  return (
    <Container className={`manage-claims-container ${currentTheme}-theme`}>
      <Card className="manage-claims-card">
        <Card.Body>
          <h2 className="manage-claims-title">Déclarations</h2>

          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {error && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}

          {!loading && !error && claims.length === 0 && (
            <Alert variant="info" className="text-center">
              Pas de déclarations
            </Alert>
          )}

          {!loading && !error && claims.length > 0 && (
            <div className="table-responsive">
              <Table hover className="manage-claims-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Type de Sinistre</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim, index) => {
                    const userIdDetails = getUserIdDetails(claim.userId);
                    return (
                      <tr key={claim._id}>
                        <td>{index + 1}</td>
                        <td>{userIdDetails.name}</td>
                        <td>{userIdDetails.email}</td>
                        <td>{claim.incidentType || "N/A"}</td>
                        <td>{getStatusBadge(claim.status)}</td>
                        <td className="actions-cell">
                          <OverlayTrigger overlay={<Tooltip id={`see-more-tooltip-${claim._id}`}>Voir plus</Tooltip>}>
                            <Button
                              size="sm"
                              className="action-btn see-more-btn"
                              onClick={() => handleSeeMore(claim)}
                            >
                              <FaEye className="me-2" /> Voir plus
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip id={`approve-tooltip-${claim._id}`}>Approuver</Tooltip>}>
                            <Button
                              size="sm"
                              className="action-btn approve-btn"
                              onClick={() => updateStatus(claim._id, "approved")}
                            >
                              <FaCheckCircle />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip id={`reject-tooltip-${claim._id}`}>Rejeter</Tooltip>}>
                            <Button
                              size="sm"
                              className="action-btn reject-btn"
                              onClick={() => updateStatus(claim._id, "rejected")}
                            >
                              <FaTimesCircle />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip id={`delete-tooltip-${claim._id}`}>Supprimer</Tooltip>}>
                            <Button
                              size="sm"
                              className="action-btn delete-btn"
                              onClick={() => deleteClaim(claim._id)}
                              disabled={deleting === claim._id}
                            >
                              {deleting === claim._id ? <Spinner animation="border" size="sm" /> : <FaRegTrashAlt />}
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="claim-modal">
        <Modal.Header closeButton className="modal-header">
          <Modal.Title className="modal-title">
            Analyse des Déclarations
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          {selectedClaim && (
            <div className="claim-details">
              <h4>Informations Utilisateur</h4>
              <p><strong>Nom :</strong> {getUserIdDetails(selectedClaim.userId).name || "Inconnu"}</p>
              <p><strong>Email :</strong> {getUserIdDetails(selectedClaim.userId).email || "Inconnu"}</p>
              <p><strong>Téléphone :</strong> {getUserIdDetails(selectedClaim.userId).phone || "Inconnu"}</p>
              <h4>Détails du Contrat</h4>
              <p><strong>Type de Police :</strong> {getContractDetails(selectedClaim.contractId).policyType || "Inconnu"}</p>
              <p><strong>Date de Début :</strong> {formatDateFr(getContractDetails(selectedClaim.contractId).startDate || "N/A")}</p>
              <p><strong>Date de Fin :</strong> {formatDateFr(getContractDetails(selectedClaim.contractId).endDate || "N/A")}</p>
              <p><strong>Statut :</strong> {getContractDetails(selectedClaim.contractId).status || "N/A"}</p>
              <h4>Détails du Sinistre</h4>
              <p><strong>Type de Sinistre :</strong> {selectedClaim.incidentType || "N/A"}</p>
              <p><strong>Date de l'Incident :</strong> {formatDateFr(selectedClaim.incidentDate || "N/A")}</p>
              <p><strong>Heure de l'Incident :</strong> {selectedClaim.incidentTime || "N/A"}</p>
              <p><strong>Lieu de l'Incident :</strong> {selectedClaim.incidentLocation || "N/A"}</p>
              <p><strong>Description :</strong> {selectedClaim.incidentDescription || "Aucune description"}</p>
              <p><strong>Dommages :</strong> {selectedClaim.damages || "N/A"}</p>
              <p><strong>Tiers Impliqué :</strong> {selectedClaim.thirdPartyInvolved ? "Oui" : "Non"}</p>
              {selectedClaim.thirdPartyInvolved && selectedClaim.thirdPartyDetails && (
                <div>
                  <p><strong>Nom du Tiers :</strong> {selectedClaim.thirdPartyDetails.name || "N/A"}</p>
                  <p><strong>Contact :</strong> {selectedClaim.thirdPartyDetails.contactInfo || "N/A"}</p>
                  <p><strong>Numéro d'Immatriculation :</strong> {selectedClaim.thirdPartyDetails.registrationId || "N/A"}</p>
                  <p><strong>Contact Assureur :</strong> {selectedClaim.thirdPartyDetails.insurerContact || "N/A"}</p>
                </div>
              )}
              <p><strong>Statut :</strong> {getStatusBadge(selectedClaim.status).props.children}</p>
              <p><strong>Date de Création :</strong> {formatDateFr(selectedClaim.createdAt)}</p>

              <h4>Documents Soutenants</h4>
              {selectedClaim.supportingFiles && selectedClaim.supportingFiles.length > 0 ? (
                <ul>
                  {selectedClaim.supportingFiles.map((file, index) => (
                    <li key={index}>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">{file.fileName}</a> 
                      (Type: {file.fileType}, Uploaded: {formatDateFr(file.uploadedAt)})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aucun document joint</p>
              )}

              <h4>Commentaires</h4>
              {selectedClaim.comments && selectedClaim.comments.length > 0 ? (
                <ul>
                  {selectedClaim.comments.map((comment, index) => (
                    <li key={index}>
                      {comment.comment} (Par: {comment.supervisorId.name || "Inconnu"}, 
                      le {formatDateFr(comment.createdAt)})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aucun commentaire</p>
              )}

              <h4>Analyse (si disponible)</h4>
              {analysisResult ? (
                <div>
                  <p><strong>Prédiction :</strong> {analysisResult.prediction}</p>
                  <p><strong>Probabilité Suspicieux :</strong> {(analysisResult.probability_suspicieux * 100).toFixed(2)}%</p>
                  <p><strong>Probabilité Valide :</strong> {(analysisResult.probability_valide * 100).toFixed(2)}%</p>
                </div>
              ) : (
                <p>Aucune analyse effectuée</p>
              )}

              {error && <Alert variant="danger">{error}</Alert>}
              <Form.Group controlId="commentForm">
                <Form.Label>Commentaire</Form.Label>
                <Form.Control
                  as="textarea"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Entrez votre commentaire ici..."
                  rows={3}
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            className="close-button"
          >
            Fermer
          </Button>
          {selectedClaim && selectedClaim.status !== "approved" && (
            <>
              <Button
                variant="success"
                onClick={() => updateStatus(selectedClaim._id, "approved")}
                className="modal-action-btn approve-modal-btn"
              >
                <FaCheckCircle /> Approuver
              </Button>
              <Button
                variant="danger"
                onClick={() => updateStatus(selectedClaim._id, "rejected")}
                className="modal-action-btn reject-modal-btn"
              >
                <FaTimesCircle /> Rejeter
              </Button>
              <Button
                variant="primary"
                onClick={() => handleAnalyze(selectedClaim)}
                disabled={analyzing}
                className="modal-action-btn analyze-ai-btn"
              >
                {analyzing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Analysant avec IA...
                  </>
                ) : (
                  <>
                    <FaBrain className="me-2" /> Analyser avec IA
                  </>
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageClaims;