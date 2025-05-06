import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Table, Modal, Spinner, Alert, Container, Card, OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import { FaRegEdit, FaRegTrashAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import "./ManageClaims.css";
import { useTheme } from "../context/ThemeContext";

interface Claim {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  incidentDescription: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const API_BASE_URL = "http://localhost:5000/api/supervisor/claims";

const ManageClaims: React.FC = () => {
  const { currentTheme } = useTheme();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await axios.get<Claim[]>(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid API response format");
      }

      setClaims(response.data);
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

      await axios.put(
        `${API_BASE_URL}/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClaims(claims.map(claim => 
        claim._id === id ? { ...claim, status } : claim
      ));
    } catch (error) {
      console.error("Error updating claim status:", error);
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
    } catch (error) {
      console.error("Error deleting claim:", error);
      alert("Failed to delete claim.");
    }
  };

  const analyzeClaim = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowModal(true);
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
                    <th>Téléphone</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim, index) => (
                    <tr key={claim._id}>
                      <td>{index + 1}</td>
                      <td>{claim.firstName} {claim.lastName}</td>
                      <td>{claim.email}</td>
                      <td>{claim.phone}</td>
                      <td className="description-cell">{claim.incidentDescription}</td>
                      <td>{getStatusBadge(claim.status)}</td>
                      <td className="actions-cell">
                        <OverlayTrigger overlay={<Tooltip id={`edit-tooltip-${claim._id}`}>Analyze Claim</Tooltip>}>
                          <Button
                            size="sm"
                            className="action-btn analyze-btn"
                            onClick={() => analyzeClaim(claim)}
                          >
                            <FaRegEdit />
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
                  ))}
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
                <span className="detail-value">{selectedClaim.firstName} {selectedClaim.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedClaim.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Téléphone:</span>
                <span className="detail-value">{selectedClaim.phone}</span>
              </div>
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
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageClaims;