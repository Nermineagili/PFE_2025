import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Badge, Table, Spinner, Container, Card, Button, Modal } from "react-bootstrap";
import { IoMdCheckmarkCircleOutline, IoMdDocument, IoMdCalendar, IoMdPerson } from "react-icons/io";
import { FiX, FiAlertCircle, FiCheckCircle, FiClock } from "react-icons/fi";
import { motion } from "framer-motion";
import "./MesDeclarations.css";

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
  updatedAt: string;
  supportingFiles: { publicId: string; url: string; fileName: string; fileType: string; uploadedAt: string }[];
  comments: { comment: string; supervisorId: { name: string; email: string }; createdAt: string }[];
}

interface Contract {
  _id: string;
  policyType: string;
  startDate: string;
  endDate: string;
  status: string;
}

const MesDeclarations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [updatedClaims, setUpdatedClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchClaims = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:5000/api/claims/user/${user._id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          });
          const fetchedClaims = response.data.data;
          setClaims(fetchedClaims);

          const lastVisit = localStorage.getItem(`lastVisit_${user._id}`);
          if (lastVisit) {
            const newUpdates = fetchedClaims.filter(
              (claim: { updatedAt: string | number | Date; status: string }) =>
                new Date(claim.updatedAt) > new Date(lastVisit) && claim.status !== "pending"
            );

            if (newUpdates.length > 0) {
              setUpdatedClaims(newUpdates);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 7000);
            }
          }
        } catch (error: any) {
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

    const fetchActiveContracts = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:5000/api/user/${user._id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          });
          const userData = response.data.data;
          const now = new Date();
          const activeContracts = userData.contracts.filter((contract: Contract) => {
            return contract.status === 'active' &&
                   new Date(contract.startDate) <= now &&
                   new Date(contract.endDate) >= now;
          });
          setActiveContracts(activeContracts);
        } catch (error) {
          console.error("Erreur lors de la récupération des contrats", error);
        }
      }
    };

    fetchClaims();
    fetchActiveContracts();

    if (user) {
      localStorage.setItem(`lastVisit_${user._id}`, new Date().toISOString());
    }
  }, [user, navigate]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved": return "success";
      case "rejected": return "danger";
      default: return "warning";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <FiCheckCircle className="me-1" />;
      case "rejected": return <FiAlertCircle className="me-1" />;
      default: return <FiClock className="me-1" />;
    }
  };

  const formatDateFr = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  const dismissToast = () => setShowToast(false);

  const isClaimUpdated = (claimId: string) => updatedClaims.some((c) => c._id === claimId);

  const handleShowDetails = async (claimId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/claims/user/${user?._id}/${claimId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setSelectedClaim(response.data.data);
      setShowModal(true);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la déclaration", error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClaim(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.section 
      className="declarations-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
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
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants}>
            <Card className="declarations-card">
              <Card.Body>
                <h2 className="declarations-title">Mes Déclarations</h2>

                {loading ? (
                  <div className="spinner-container">
                    <Spinner animation="border" variant="primary" />
                    <p>Chargement de vos déclarations...</p>
                  </div>
                ) : claims.length === 0 ? (
                  <div className="empty-state">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <IoMdDocument size={60} color="#153a64" />
                      <p>Vous n'avez pas encore fait de déclaration</p>
                      <Button variant="outline-primary" onClick={() => navigate("/clienthome")} className="mt-2">
                        Faire une déclaration
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="declarations-table">
                      <thead>
                        <tr>
                          <th>Référence</th>
                          <th>Type de Sinistre</th>
                          <th>Description</th>
                          <th>Statut</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claims.map((claim) => (
                          <motion.tr 
                            key={claim._id} 
                            className={isClaimUpdated(claim._id) ? "updated-claim" : ""}
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                          >
                            <td><strong>#{claim._id.slice(-6).toUpperCase()}</strong></td>
                            <td>{claim.incidentType || "N/A"}</td>
                            <td className="description-cell">
                              {claim.incidentDescription.length > 50
                                ? `${claim.incidentDescription.substring(0, 50)}...`
                                : claim.incidentDescription}
                            </td>
                            <td>
                              <Badge pill bg={getStatusBadgeColor(claim.status)} className="status-badge">
                                {getStatusIcon(claim.status)}
                                {claim.status === "pending"
                                  ? "En attente"
                                  : claim.status === "approved"
                                  ? "Approuvé"
                                  : "Rejeté"}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <IoMdCalendar className="me-1" size={16} />
                                {formatDateFr(claim.createdAt)}
                              </div>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowDetails(claim._id)}
                              >
                                Détails
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>

          {/* Display Active Contracts */}
          {/* {activeContracts.length > 0 && (
            <motion.div variants={itemVariants} className="mt-4">
              <Card className="declarations-card">
                <Card.Body>
                  <h3 className="declarations-title">Mes Contrats Actifs</h3>
                  <Table hover className="declarations-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Date de début</th>
                        <th>Date de fin</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeContracts.map((contract) => (
                        <tr key={contract._id}>
                          <td>{contract.policyType}</td>
                          <td>{formatDateFr(contract.startDate)}</td>
                          <td>{formatDateFr(contract.endDate)}</td>
                          <td>
                            <Badge pill bg={contract.status === "active" ? "success" : "warning"} className="status-badge">
                              {contract.status === "active" ? "Actif" : "Inactif"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </motion.div>
          )} */}
        </motion.div>
      </Container>

      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        centered
        size="lg"
        className="claim-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <IoMdDocument className="me-2" />
            Détails de la Déclaration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClaim ? (
            <div className="p-2">
              <div className="row mb-4">
                <div className="col-md-6">
                  <p><strong>Référence:</strong> #{selectedClaim._id.slice(-6).toUpperCase()}</p>
                  <p>
                    <strong>Statut:</strong> 
                    <Badge pill bg={getStatusBadgeColor(selectedClaim.status)} className="status-badge ms-2">
                      {getStatusIcon(selectedClaim.status)}
                      {selectedClaim.status === "pending"
                        ? "En attente"
                        : selectedClaim.status === "approved"
                        ? "Approuvé"
                        : "Rejeté"}
                    </Badge>
                  </p>
                  <p><strong>Date de création:</strong> {formatDateFr(selectedClaim.createdAt)}</p>
                  <p><strong>Type de sinistre:</strong> {selectedClaim.incidentType || "N/A"}</p>
                  <p><strong>Date et heure:</strong> {formatDateFr(selectedClaim.incidentDate)} à {selectedClaim.incidentTime}</p>
                  <p><strong>Lieu:</strong> {selectedClaim.incidentLocation || "N/A"}</p>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-2">
                    <IoMdPerson size={20} className="me-2" color="#153a64" />
                    <strong>Informations Personnelles</strong>
                  </div>
                  <p><strong>Nom:</strong> {selectedClaim.firstName} {selectedClaim.lastName}</p>
                  <p><strong>Date de naissance:</strong> {selectedClaim.birthDate
                    ? `${selectedClaim.birthDate.day}/${selectedClaim.birthDate.month}/${selectedClaim.birthDate.year}`
                    : "N/A"}</p>
                  <p><strong>Profession:</strong> {selectedClaim.profession || "N/A"}</p>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center mb-2">
                    <IoMdDocument size={20} className="me-2" color="#153a64" />
                    <strong>Circonstances de l'incident</strong>
                  </div>
                  <div className="p-3 bg-light rounded">
                    {selectedClaim.incidentDescription}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center mb-2">
                    <IoMdDocument size={20} className="me-2" color="#153a64" />
                    <strong>Dommages subis</strong>
                  </div>
                  <div className="p-3 bg-light rounded">
                    {selectedClaim.damages}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-2">
                    <IoMdPerson size={20} className="me-2" color="#153a64" />
                    <strong>Coordonnées</strong>
                  </div>
                  <p><strong>Téléphone:</strong> {selectedClaim.phone}</p>
                  <p><strong>Email:</strong> {selectedClaim.email}</p>
                  <p><strong>Adresse postale:</strong> {selectedClaim.postalAddress}</p>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-2">
                    <IoMdDocument size={20} className="me-2" color="#153a64" />
                    <strong>Contrat Associé</strong>
                  </div>
                  {selectedClaim.contractId && typeof selectedClaim.contractId !== "string" ? (
                    <>
                      <p><strong>Type:</strong> {selectedClaim.contractId.policyType}</p>
                      <p><strong>Date de début:</strong> {formatDateFr(selectedClaim.contractId.startDate)}</p>
                      <p><strong>Date de fin:</strong> {formatDateFr(selectedClaim.contractId.endDate)}</p>
                    </>
                  ) : (
                    <p>Contrat non disponible</p>
                  )}
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center mb-2">
                    <IoMdDocument size={20} className="me-2" color="#153a64" />
                    <strong>Tiers impliqué</strong>
                  </div>
                  <p><strong>Tiers impliqué:</strong> {selectedClaim.thirdPartyInvolved ? "Oui" : "Non"}</p>
                  {selectedClaim.thirdPartyInvolved && selectedClaim.thirdPartyDetails && (
                    <>
                      <p><strong>Nom:</strong> {selectedClaim.thirdPartyDetails.name || "N/A"}</p>
                      <p><strong>Coordonnées:</strong> {selectedClaim.thirdPartyDetails.contactInfo || "N/A"}</p>
                      <p><strong>N° d'immatriculation:</strong> {selectedClaim.thirdPartyDetails.registrationId || "N/A"}</p>
                      <p><strong>Assureur:</strong> {selectedClaim.thirdPartyDetails.insurerContact || "N/A"}</p>
                    </>
                  )}
                </div>
              </div>

              {selectedClaim.supportingFiles && selectedClaim.supportingFiles.length > 0 && (
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="d-flex align-items-center mb-2">
                      <IoMdDocument size={20} className="me-2" color="#153a64" />
                      <strong>Fichiers à l'appui</strong>
                    </div>
                    {selectedClaim.supportingFiles.map((file, index) => (
                      <p key={index}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          {file.fileName} ({file.fileType})
                        </a>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {selectedClaim.comments && selectedClaim.comments.length > 0 && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="d-flex align-items-center mb-2">
                      <IoMdPerson size={20} className="me-2" color="#153a64" />
                      <strong>Commentaires du Superviseur</strong>
                    </div>
                    {selectedClaim.comments.map((comment, index) => (
                      <div key={index} className="p-3 mb-2 bg-light rounded">
                        <p><strong>Commentaire:</strong> {comment.comment}</p>
                        <p><strong>Superviseur:</strong> {comment.supervisorId.name} ({comment.supervisorId.email})</p>
                        <p><strong>Date:</strong> {formatDateFr(comment.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="spinner-container">
              <Spinner animation="border" variant="primary" />
              <p>Chargement des détails...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </motion.section>
  );
};

export default MesDeclarations;