import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Table, Modal, Spinner, Alert, Container, Card, OverlayTrigger, Tooltip, Badge, Form } from "react-bootstrap";
import { FaRegEdit, FaRegTrashAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import "./ManageClaims.css";
import { useTheme } from "../context/ThemeContext";

// Define the Claim interface (removed contractId)
interface Claim {
  _id: string;
  userId: { name: string; email: string; phone: string } | string | null; // Allow string (_id) or null
  // Removed contractId field since it no longer exists in the model
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  incidentDescription: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  supportingFiles: { publicId: string; url: string; fileName: string; fileType: string; uploadedAt: string }[];
  comments: { comment: string; supervisorId: string; createdAt: string }[];
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
        // Update the claims list
        setClaims(claims.map(claim =>
          claim._id === id ? { ...claim, status, comments: response.data.data.comments } : claim
        ));
        
        // Update the selected claim in the modal if it's the same claim
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
      
      // Close modal if the deleted claim was being viewed
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

  // Helper function to safely get userId details
  const getUserIdDetails = (userId: Claim["userId"]) => {
    if (!userId || typeof userId === "string") return { name: "Unknown", email: "Unknown", phone: "Unknown" };
    return userId;
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
              pas de déclarations
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
                          <OverlayTrigger overlay={<Tooltip id={`approve-tooltip-${claim._id}`}>Approve</Tooltip>}>
                            <Button
                              size="sm"
                              className="action-btn approve-btn"
                              onClick={() => updateStatus(claim._id, "approved")}
                            >
                              <FaCheckCircle />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip id={`reject-tooltip-${claim._id}`}>Reject</Tooltip>}>
                            <Button
                              size="sm"
                              className="action-btn reject-btn"
                              onClick={() => updateStatus(claim._id, "rejected")}
                            >
                              <FaTimesCircle />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip id={`delete-tooltip-${claim._id}`}>Delete</Tooltip>}>
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
            Analyse des déclarations
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          {selectedClaim && (
            <div className="claim-details">
              <div className="detail-row">
                <span className="detail-label">Nom et Prénom:</span>
                <span className="detail-value">{getUserIdDetails(selectedClaim.userId).name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{getUserIdDetails(selectedClaim.userId).email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Téléphone:</span>
                <span className="detail-value">{selectedClaim.phone || "N/A"}</span>
              </div>
              {/* Removed contract details section since contractId no longer exists */}
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{getStatusBadge(selectedClaim.status)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Crée:</span>
                <span className="detail-value">
                  {new Date(selectedClaim.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="detail-row full-width">
                <span className="detail-label">Description:</span>
                <div className="incident-description">
                  {selectedClaim.incidentDescription}
                </div>
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
                        {comment.comment} (Ajouté le {new Date(comment.createdAt).toLocaleString()})
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
            Close
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