import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Spinner, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import { FaCheck, FaSyncAlt, FaKey } from 'react-icons/fa';
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
          ? err.response?.data?.error || err.message
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
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <Card className="reset-approval-card">
      <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
        <div>
          <FaKey className="me-2" style={{ color: '#153a64' }} /> Demandes de réinitialisation de mot de passe
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={fetchNotifications}
          disabled={loading}
        >
          <FaSyncAlt className={loading ? 'spin' : ''} />
        </Button>
      </Card.Header>

      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
            {resetLink && (
              <div className="mt-2">
                <small>Lien de réinitialisation :</small>
                <div className="reset-link-box">{resetLink}</div>
              </div>
            )}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement des demandes...</p>
          </div>
        ) : notifications.length === 0 ? (
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
                {notifications.map((notification) => (
                  <tr key={notification._id}>
                    <td>{notification.relatedId.name}</td>
                    <td>{notification.relatedId.email}</td>
                    <td>{new Date(notification.createdAt).toLocaleString()}</td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApproveRequest(notification._id, notification.relatedId._id)}
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
    </Card>
  );
};

export default ResetPasswordApproval;