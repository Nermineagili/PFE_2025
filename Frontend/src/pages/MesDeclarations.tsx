import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Badge, Table, Spinner, Container, Card, Button } from "react-bootstrap";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FiX } from "react-icons/fi";
import "./MesDeclarations.css";
interface Claim {
  _id: string;
  incidentDescription: string;
  status: 'pending' | 'approved' | 'rejected';
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

  useEffect(() => {
    const fetchClaims = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:5000/api/claims/user/${user._id}`);
          const fetchedClaims = response.data;
          
          // Check for updates since last visit
          const lastVisit = localStorage.getItem(`lastVisit_${user._id}`);
          if (lastVisit) {
            const newUpdates = fetchedClaims.filter((claim: { updatedAt: string | number | Date; status: string; }) => 
              new Date(claim.updatedAt) > new Date(lastVisit) && 
              claim.status !== 'pending'
            );
            
            if (newUpdates.length > 0) {
              setUpdatedClaims(newUpdates);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 5000);
            }
          }
          
          setClaims(fetchedClaims);
          
          // Clear the navbar notification
          localStorage.setItem("seenClaimUpdate", "true");
        } catch (error) {
          console.error("Error fetching claims", error);
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
    return updatedClaims.some(c => c._id === claimId);
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
                <Button variant="outline-primary" onClick={() => navigate('/clienthome')}>
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
                          <Badge 
                            pill 
                            bg={getStatusBadgeColor(claim.status)}
                            className="status-badge"
                          >
                            {claim.status === 'pending' ? 'En attente' : 
                             claim.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                          </Badge>
                        </td>
                        <td>{new Date(claim.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigate(`/claim-details/${claim._id}`)}
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
    
    </section>
  );
};

export default MesDeclarations;