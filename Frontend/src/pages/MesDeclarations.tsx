import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Badge, Table, Spinner, Container, Card, Button, Modal } from "react-bootstrap";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FiX } from "react-icons/fi";
import "./MesDeclarations.css";

interface Claim {
  _id: string;
  firstName?: string;
  lastName?: string;
  birthDate?: { day: number; month: number; year: number };
  sexe?: string;
  phone?: string;
  address?: string;
  postalAddress?: string;
  city?: string;
  postalCode?: string;
  email?: string;
  stateProvince?: string;
  incidentDescription: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

const MesDeclarations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [updatedClaims, setUpdatedClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchClaims = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:5000/api/claims/user/${user._id}`);
          const fetchedClaims = response.data;

          // Gestion des mises à jour
          const lastVisit = localStorage.getItem(`lastVisit_${user._id}`);
          if (lastVisit) {
            const newUpdates = fetchedClaims.filter(
              (claim: { updatedAt: string | number | Date; status: string }) =>
                new Date(claim.updatedAt) > new Date(lastVisit) && claim.status !== "pending"
            );

            if (newUpdates.length > 0) {
              setUpdatedClaims(newUpdates);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 5000);
            }
          }

          setClaims(fetchedClaims); // même si vide, c’est correct
        } catch (error: any) {
          // Si le backend renvoie une 404, on considère simplement qu’il n’y a pas encore de déclarations
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            setClaims([]);
          } else {
            console.error("Erreur lors de la récupération des déclarations", error);
          }
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/signin");
      }
    };

    fetchClaims();

    // Set current visit time
    if (user) {
      localStorage.setItem(`lastVisit_${user._id}`, new Date().toISOString());
    }
  }, [user, navigate]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "warning";
    }
  };

  const dismissToast = () => {
    setShowToast(false);
  };

  const isClaimUpdated = (claimId: string) => {
    return updatedClaims.some((c) => c._id === claimId);
  };

  const handleShowDetails = async (claimId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/claims/user/${user?._id}/${claimId}`);
      setSelectedClaim(response.data);
      setShowModal(true);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la déclaration", error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClaim(null);
  };

  return (
    <section className="declarations-section">
      {/* Modern Toast Notification */}
      {showToast && (
        <div className="update-toast visible">
          <IoMdCheckmarkCircleOutline className="toast-icon" />
          <div className="toast-content">
            <div className="toast-title">Mises à jour disponibles</div>
            <div className="toast-message">
              {updatedClaims.length} déclaration(s) ont été mises à jour
            </div>
          </div>
          <FiX className="toast-close" onClick={dismissToast} />
        </div>
      )}

      <Container className="declarations-container">
        <Card className="declarations-card">
          <Card.Body>
            <h2 className="declarations-title">Mes Déclarations</h2>

            {loading ? (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Chargement en cours...</p>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-4">
                <p>Aucune déclaration trouvée</p>
                <Button variant="outline-primary" onClick={() => navigate("/clienthome")}>
                  Faire une déclaration
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="declarations-table">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Description</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim._id} className={isClaimUpdated(claim._id) ? "updated-claim" : ""}>
                        <td>#{claim._id.slice(-6).toUpperCase()}</td>
                        <td className="description-cell">
                          {claim.incidentDescription.length > 50
                            ? `${claim.incidentDescription.substring(0, 50)}...`
                            : claim.incidentDescription}
                        </td>
                        <td>
                          <Badge pill bg={getStatusBadgeColor(claim.status)} className="status-badge">
                            {claim.status === "pending"
                              ? "En attente"
                              : claim.status === "approved"
                              ? "Approuvé"
                              : "Rejeté"}
                          </Badge>
                        </td>
                        <td>{new Date(claim.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleShowDetails(claim._id)}
                          >
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Modal for Claim Details */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Détails de la Déclaration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClaim ? (
            <div>
              <p><strong>Référence:</strong> #{selectedClaim._id.slice(-6).toUpperCase()}</p>
              <p><strong>Nom:</strong> {selectedClaim.firstName} {selectedClaim.lastName}</p>
              <p><strong>Date de naissance:</strong> {selectedClaim.birthDate
                ? `${selectedClaim.birthDate.day}/${selectedClaim.birthDate.month}/${selectedClaim.birthDate.year}`
                : "N/A"}</p>
              <p><strong>Sexe:</strong> {selectedClaim.sexe === "homme" ? "Homme" : "Femme"}</p>
              <p><strong>Téléphone:</strong> {selectedClaim.phone}</p>
              <p><strong>Adresse:</strong> {selectedClaim.address}</p>
              <p><strong>Adresse postale:</strong> {selectedClaim.postalAddress}</p>
              <p><strong>Ville:</strong> {selectedClaim.city}</p>
              <p><strong>Code postal:</strong> {selectedClaim.postalCode}</p>
              <p><strong>Email:</strong> {selectedClaim.email}</p>
              <p><strong>Province/État:</strong> {selectedClaim.stateProvince}</p>
              <p><strong>Description de l'incident:</strong> {selectedClaim.incidentDescription}</p>
              <p><strong>Statut:</strong> 
                {selectedClaim.status === "pending"
                  ? "En attente"
                  : selectedClaim.status === "approved"
                  ? "Approuvé"
                  : "Rejeté"}
              </p>
              <p><strong>Date de création:</strong> {new Date(selectedClaim.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
          ) : (
            <p>Chargement des détails...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* <ChatBot isAuthenticated={true} initialMessages={[]} /> */}
    </section>
  );
};

export default MesDeclarations;