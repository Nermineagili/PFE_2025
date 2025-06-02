import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Table, Modal, Spinner, Alert, Container, Card, OverlayTrigger, Tooltip, Badge, Form } from "react-bootstrap";
import { FaRegTrashAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import "./ManageClaims.css";
import { useTheme } from "../context/ThemeContext";

// Updated Claim interface to match the new model
interface Claim {
  _id: string;
  userId: { name: string; email: string; phone: string } | string | null;
  contractId: { policyType: string; startDate: string; endDate: string; status: string } | string | null; // Added contractId
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
}

// Define the backend response type for fetching claims (array of claims)
interface ApiResponse {
  success: boolean;
  message: string;
  data: Claim[];
}

// Define the backend response type for updating a claim (single claim)
interface UpdateClaimResponse {
  success: boolean;
  message: string;
  data: Claim;
}

const API_BASE_URL = "http://localhost:5000/api/supervisor/claims";

const ManageClaims: React.FC = () => {
  const { currentTheme } = useTheme();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState(""); // State for comment input

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

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setClaims(claims.filter(claim => claim._id !== id));
      
      if (selectedClaim && selectedClaim._id === id) {
        setShowModal(false);
        setSelectedClaim(null);
      }
    } catch (error) {
      console.error("Error deleting claim:", error);
      alert("Failed to delete claim.");
    }
  };

  const handleSeeMore = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowModal(true);
    setComment("");
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
                              Voir plus
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
                            >
                              <FaRegTrashAlt />
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

      {/* Modal for Claim Analysis */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="claim-modal">
        <Modal.Header closeButton className="modal-header">
          <Modal.Title className="modal-title">
            Analyse des Déclarations
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          {selectedClaim && (
            <div className="claim-details">
              <div className="detail-row">
                <span className="detail-label">Nom et Prénom:</span>
                <span className="detail-value">{selectedClaim.firstName} {selectedClaim.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedClaim.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Téléphone:</span>
                <span className="detail-value">{selectedClaim.phone || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Profession:</span>
                <span className="detail-value">{selectedClaim.profession || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date de Naissance:</span>
                <span className="detail-value">
                  {selectedClaim.birthDate
                    ? `${selectedClaim.birthDate.day}/${selectedClaim.birthDate.month}/${selectedClaim.birthDate.year}`
                    : "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Adresse Postale:</span>
                <span className="detail-value">{selectedClaim.postalAddress || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type de Contrat:</span>
                <span className="detail-value">{getContractDetails(selectedClaim.contractId).policyType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Dates du Contrat:</span>
                <span className="detail-value">
                  {getContractDetails(selectedClaim.contractId).startDate} - {getContractDetails(selectedClaim.contractId).endDate}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type de Sinistre:</span>
                <span className="detail-value">{selectedClaim.incidentType || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date et Heure:</span>
                <span className="detail-value">
                  {formatDateFr(selectedClaim.incidentDate)} à {selectedClaim.incidentTime}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Lieu:</span>
                <span className="detail-value">{selectedClaim.incidentLocation || "N/A"}</span>
              </div>
              <div className="detail-row full-width">
                <span className="detail-label">Circonstances:</span>
                <div className="incident-description">
                  {selectedClaim.incidentDescription}
                </div>
              </div>
              <div className="detail-row full-width">
                <span className="detail-label">Dommages:</span>
                <div className="incident-description">
                  {selectedClaim.damages}
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tiers Impliqué:</span>
                <span className="detail-value">{selectedClaim.thirdPartyInvolved ? "Oui" : "Non"}</span>
              </div>
              {selectedClaim.thirdPartyInvolved && selectedClaim.thirdPartyDetails && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Nom du Tiers:</span>
                    <span className="detail-value">{selectedClaim.thirdPartyDetails.name || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Coordonnées:</span>
                    <span className="detail-value">{selectedClaim.thirdPartyDetails.contactInfo || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">N° Immatriculation:</span>
                    <span className="detail-value">{selectedClaim.thirdPartyDetails.registrationId || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Assureur du Tiers:</span>
                    <span className="detail-value">{selectedClaim.thirdPartyDetails.insurerContact || "N/A"}</span>
                  </div>
                </>
              )}
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{getStatusBadge(selectedClaim.status)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Créé le:</span>
                <span className="detail-value">
                  {new Date(selectedClaim.createdAt).toLocaleString()}
                </span>
              </div>
              {selectedClaim.supportingFiles && selectedClaim.supportingFiles.length > 0 && (
                <div className="detail-row full-width">
                  <span className="detail-label">Fichiers à l'appui:</span>
                  <div className="incident-description">
                    {selectedClaim.supportingFiles.map((file, index) => (
                      <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="file-link">
                        {file.fileName} ({file.fileType})
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedClaim.comments && selectedClaim.comments.length > 0 && (
                <div className="detail-row full-width">
                  <span className="detail-label">Commentaires:</span>
                  <div className="incident-description">
                    {selectedClaim.comments.map((comment, index) => (
                      <p key={index}>
                        {comment.comment} - {comment.supervisorId.name} ({comment.supervisorId.email}) (Ajouté le {new Date(comment.createdAt).toLocaleString()})
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {selectedClaim.status !== "approved" && (
                <div className="detail-row full-width">
                  <span className="detail-label">Ajouter un commentaire (pour rejet):</span>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Entrez la raison du rejet..."
                  />
                </div>
              )}
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
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageClaims;