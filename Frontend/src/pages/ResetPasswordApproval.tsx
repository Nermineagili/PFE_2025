import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Spinner, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import { FaCheck, FaSyncAlt, FaKey, FaClipboard, FaExclamationTriangle } from 'react-icons/fa';
import './ResetPasswordApproval.css';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  relatedId: { _id: string; name: string; email: string };
  isRead: boolean;
  createdAt: string;
}

const ResetPasswordApproval: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{ id: string; userId: string; name: string } | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resetRequests = response.data.filter((n: Notification) => n.type === 'password_reset_request' && !n.isRead);
      setNotifications(resetRequests);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.response?.data?.details || err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load password reset requests'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (notificationId: string, userId: string) => {
    setProcessingId(notificationId);
    setSuccess(null);
    setError(null);
    setResetLink(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      // Approve reset (assumes backend generates token)
      const response = await axios.post(
        `http://localhost:5000/api/auth/approve-reset`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mark notification as read
      await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Password reset request approved successfully!');
      setResetLink(response.data.userResetUrl);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error('Failed to approve reset request:', err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : err instanceof Error
            ? err.message
            : 'Failed to approve password reset'
      );
    } finally {
      setProcessingId(null);
      setShowConfirmModal(null);
    }
  };

  const copyToClipboard = () => {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
        });
    }
  };

  const formatDateRelative = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 3) {
      return `Il y a ${diffDays} jour${diffDays !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <Card className="reset-approval-card">
      <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
        <div>
          <FaKey className="me-2" /> Demandes de réinitialisation de mot de passe
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={fetchNotifications}
          disabled={loading}
        >
          <FaSyncAlt className={loading ? 'spin' : ''} /> {loading ? '' : 'Actualiser'}
        </Button>
      </Card.Header>

      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            <div className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              <div>{error}</div>
            </div>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            <div className="d-flex align-items-center mb-2">
              <FaCheck className="me-2" />
              <div>{success}</div>
            </div>
            {resetLink && (
              <div className="mt-3">
                <small>Lien de réinitialisation :</small>
                <div className="d-flex align-items-center">
                  <div className="reset-link-box flex-grow-1">
                    {resetLink}
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="ms-2" 
                    onClick={copyToClipboard}
                  >
                    <FaClipboard /> {copied ? 'Copié!' : 'Copier'}
                  </Button>
                </div>
                <small className="d-block mt-2 text-muted">
                  Partagez ce lien avec l'utilisateur pour qu'il puisse réinitialiser son mot de passe.
                </small>
              </div>
            )}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Chargement des demandes de réinitialisation...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Alert variant="info">
            <div className="text-center py-3">
              <FaKey className="mb-3" style={{ fontSize: '2rem', opacity: 0.7 }} />
              <h5>Aucune demande en attente</h5>
              <p className="mb-0">Toutes les demandes de réinitialisation de mot de passe ont été traitées.</p>
            </div>
          </Alert>
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
                {notifications.map((notification) => (
                  <tr key={notification._id}>
                    <td className="fw-semibold">{notification.relatedId.name}</td>
                    <td>{notification.relatedId.email}</td>
                    <td>{formatDateRelative(notification.createdAt)}</td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => setShowConfirmModal({
                          id: notification._id,
                          userId: notification.relatedId._id,
                          name: notification.relatedId.name
                        })}
                        disabled={processingId === notification._id}
                      >
                        {processingId === notification._id ? (
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

      {/* Confirmation Modal */}
      <Modal
        show={!!showConfirmModal}
        onHide={() => setShowConfirmModal(null)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ 
          background: 'linear-gradient(135deg, #153a64 0%, #0d2340 100%)',
          color: 'white',
          borderBottom: '3px solid #c19048'
        }}>
          <Modal.Title>Confirmer la réinitialisation</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p>
            Vous êtes sur le point d'approuver la réinitialisation de mot de passe pour <strong>{showConfirmModal?.name}</strong>.
          </p>
          <p className="text-muted mb-0">
            Un lien de réinitialisation sera généré et devra être communiqué à l'utilisateur.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(null)}>
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={() => showConfirmModal && handleApproveRequest(showConfirmModal.id, showConfirmModal.userId)}
            disabled={!!processingId}
          >
            {processingId ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-1" />
                Approbation...
              </>
            ) : (
              'Confirmer l\'approbation'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ResetPasswordApproval;