import { useEffect, useState } from "react";
import { Alert, Button, Card, Spinner, Table, Modal } from "react-bootstrap";
import axios from "axios";
import { FaCheck, FaTimes, FaEnvelope, FaSyncAlt } from "react-icons/fa";
import "./ResetPasswordApproval.css";

interface ResetRequest {
  _id: string;
  userId: string;
  name: string;
  email: string;
  requestedAt: string;
  token: string;
}

interface ResetPasswordApprovalProps {
  tokenFromURL?: string;
  userIdFromURL?: string;
}

const ResetPasswordApproval: React.FC<ResetPasswordApprovalProps> = ({ 
  tokenFromURL,
  userIdFromURL
}) => {
  const [pendingRequests, setPendingRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [urlTokenStatus, setUrlTokenStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");
  
      const response = await axios.get(
        "http://localhost:5000/api/auth/pending-reset-requests", 
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (Array.isArray(response.data)) {
        setPendingRequests(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
      setError(
        axios.isAxiosError(err) 
          ? err.response?.data?.error || err.message
          : err instanceof Error
            ? err.message
            : "Failed to load password reset requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (userId: string, token: string) => {
    setProcessingId(userId);
    setSuccess(null);
    setError(null);
    
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) throw new Error("No authentication token found");
  
      const response = await axios.get(
        `http://localhost:5000/api/auth/approve-reset/${encodeURIComponent(token)}/${userId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
  
      setSuccess("Password reset request approved successfully!");
      setResetLink(response.data.userResetUrl);
      setPendingRequests(prev => prev.filter(req => req.userId !== userId));
    } catch (err) {
      console.error("Failed to approve reset request:", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : err instanceof Error
            ? err.message
            : "Failed to approve password reset"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const processUrlToken = async (token: string, userId: string) => {
    setUrlTokenStatus('pending');
    setShowTokenModal(true);
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/auth/approve-reset/${token}/${userId}`
      );
      
      setUrlTokenStatus('success');
      setResetLink(response.data.userResetUrl);
      await fetchPendingRequests();
    } catch (err) {
      console.error("Failed to process URL token:", err);
      setUrlTokenStatus('error');
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : err instanceof Error
            ? err.message
            : "Failed to process approval link"
      );
    }
  };

  useEffect(() => {
    if (tokenFromURL && userIdFromURL) {
      processUrlToken(tokenFromURL, userIdFromURL);
    } else {
      fetchPendingRequests();
    }
  }, [tokenFromURL, userIdFromURL]);

  return (
    <Card className="reset-approval-card">
      <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
        <div>
          <FaEnvelope className="me-2" /> Demandes de réinitialisation de mot de passe
        </div>
        <Button 
          variant="outline-secondary"
          size="sm"
          onClick={fetchPendingRequests}
          disabled={loading}
        >
          <FaSyncAlt className={loading ? "spin" : ""} />
        </Button>
      </Card.Header>


      <Card.Body>
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
          {resetLink && (
            <div className="mt-2">
              <small>Lien de réinitialisation :</small>
              <div className="reset-link-box">
                {resetLink}
              </div>
            </div>
          )}
        </Alert>
      )}

      

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement des demandes...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <Alert variant="info">Aucune demande de réinitialisation en attente</Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="reset-requests-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Date de la demande</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pendingRequests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.name}</td>
                    <td>{request.email}</td>
                    <td>{new Date(request.requestedAt).toLocaleString()}</td>
                    <td>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveRequest(request.userId, request.token)}
                      disabled={processingId === request.userId}
                    >
                      {processingId === request.userId ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-1" />
                          Approbation...
                        </>
                      ) : (
                        <>
                          <FaCheck className="me-1" /> Approuver
                        </>
                      )}
                    </Button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      <Modal show={showTokenModal} onHide={() => setShowTokenModal(false)} centered>
      <Modal.Header closeButton>
  <Modal.Title>Approbation de la réinitialisation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {urlTokenStatus === 'pending' && (
          <div className="text-center py-3">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Traitement de la demande en cours...</p>
          </div>
        )}
        
        {urlTokenStatus === 'success' && (
          <Alert variant="success">
            <h5><FaCheck className="me-2" /> Demande approuvée</h5>
            <p>La réinitialisation du mot de passe a été approuvée. Un email a été envoyé à l'utilisateur avec les instructions.</p>
            {resetLink && (
              <div className="mt-3">
                <small>Lien de réinitialisation :</small>
                <div className="reset-link-box">{resetLink}</div>
              </div>
            )}
          </Alert>
        )}
        
        {urlTokenStatus === 'error' && (
          <Alert variant="danger">
            <h5><FaTimes className="me-2" /> Échec de l'approbation</h5>
            <p>Le lien d'approbation est invalide ou expiré. Veuillez vérifier la demande dans la liste ci-dessus.</p>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowTokenModal(false)}>
          Fermer
        </Button>
      </Modal.Footer>

      </Modal>
    </Card>
  );
};

export default ResetPasswordApproval;