import React, { useEffect, useState } from 'react';
import { Container, Card, ListGroup, Button, Spinner, Form, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BsInbox, BsArrowRepeat, BsReply, BsTrash } from 'react-icons/bs';
import AdsupNavbar from './AdsupNavbar';
import './SupervisorMessages.css';

interface Notification {
  _id: string;
  userId: string;
  type: 'contact_message' | 'password_reset_request';
  message: string;
  relatedId: { _id: string; name: string; email: string } | null;
  isRead: boolean;
  createdAt: string;
}

const SupervisorMessages: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyText, setReplyText] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotifications = async () => {
    console.log('[SupervisorMessages] Fetching notifications');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('[SupervisorMessages] No auth token found, redirecting to /signin');
        setAlert({ type: 'danger', text: 'Please log in to view messages.' });
        navigate('/signin');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('[SupervisorMessages] Notifications response:', response.data);
      const contactMessages = response.data.filter((n: Notification) => n.type === 'contact_message');
      setNotifications(contactMessages);
    } catch (error) {
      console.error('[SupervisorMessages] Error fetching notifications:', error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.details || error.message
        : 'Failed to load messages. Please try again later.';
      setAlert({ type: 'danger', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[SupervisorMessages] Component mounted');
    fetchNotifications();
  }, []);

  const handleReply = async () => {
    if (!selectedNotification || !selectedNotification.relatedId) {
      setAlert({ type: 'danger', text: 'Cannot reply: Invalid notification data.' });
      return;
    }
    const payload = {
      to: selectedNotification.relatedId.email,
      subject: replySubject,
      message: replyText,
      notificationId: selectedNotification._id,
    };
    console.log('[SupervisorMessages] Reply payload:', payload);
    if (!payload.to || !payload.subject || !payload.message || !payload.notificationId) {
      setAlert({ type: 'danger', text: 'Cannot reply: Missing required fields.' });
      return;
    }
    setSending(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('[SupervisorMessages] No auth token found, redirecting to /signin');
        setAlert({ type: 'danger', text: 'Please log in to send a reply.' });
        navigate('/signin');
        return;
      }

      await axios.post(
        'http://localhost:5000/api/contact/reply',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.put(
        `http://localhost:5000/api/notifications/${selectedNotification._id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAlert({ type: 'success', text: 'Reply sent successfully.' });
      setSelectedNotification(null);
      setReplySubject('');
      setReplyText('');
      fetchNotifications();
    } catch (error) {
      console.error('[SupervisorMessages] Error sending reply:', error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.details || error.message
        : 'Failed to send reply. Please try again later.';
      setAlert({ type: 'danger', text: errorMessage });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm || !showDeleteConfirm.relatedId) {
      setAlert({ type: 'danger', text: 'Cannot delete: Invalid notification data.' });
      setShowDeleteConfirm(null);
      return;
    }
    console.log('[SupervisorMessages] Delete payload:', {
      notificationId: showDeleteConfirm._id,
      contactMessageId: showDeleteConfirm.relatedId._id
    });
    setDeleting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('[SupervisorMessages] No auth token found, redirecting to /signin');
        setAlert({ type: 'danger', text: 'Please log in to delete messages.' });
        navigate('/signin');
        return;
      }

      await axios.post(
        'http://localhost:5000/api/contact/delete',
        {
          notificationId: showDeleteConfirm._id,
          contactMessageId: showDeleteConfirm.relatedId._id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(notifications.filter(n => n._id !== showDeleteConfirm._id));
      setAlert({ type: 'success', text: 'Message deleted successfully.' });
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('[SupervisorMessages] Error deleting message:', error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.details || error.message
        : 'Failed to delete message. Please try again later.';
      setAlert({ type: 'danger', text: errorMessage });
    } finally {
      setDeleting(false);
    }
  };

  console.log('[SupervisorMessages] Rendering, notifications:', notifications.length, 'loading:', loading);

  return (
    <div className="supervisor-messages-layout">
      <AdsupNavbar />
      <div className="supervisor-messages-content">
        <Container className="py-4 mt-3">
          <Card className="messages-card">
            <Card.Header className="messages-card-header d-flex justify-content-between align-items-center">
              <h2 className="messages-title">
                <BsInbox className="me-2" /> Boîte de réception
              </h2>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => fetchNotifications()}
                disabled={loading}
              >
                <BsArrowRepeat className={`me-1 ${loading ? 'spin-animation' : ''}`} /> Actualiser
              </Button>
            </Card.Header>
            <Card.Body>
              {alert && (
                <Alert 
                  variant={alert.type} 
                  className="messages-alert" 
                  dismissible 
                  onClose={() => setAlert(null)}
                >
                  {alert.text}
                </Alert>
              )}

              {loading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Chargement des messages...</p>
                </div>
              ) : notifications.length === 0 && !alert ? (
                <div className="text-center p-5">
                  <BsInbox size={48} className="text-muted mb-3" />
                  <p className="text-center">Aucun message trouvé dans votre boîte de réception.</p>
                </div>
              ) : (
                <ListGroup className="message-list">
                  {notifications.map((msg) => {
                    if (!msg.relatedId) {
                      console.warn('[SupervisorMessages] Invalid notification, missing relatedId:', msg);
                      return (
                        <ListGroup.Item key={msg._id} className="message-item">
                          <Alert variant="warning">
                            Notification invalide : Données de contact manquantes.
                          </Alert>
                        </ListGroup.Item>
                      );
                    }
                    return (
                      <ListGroup.Item key={msg._id} className="message-item">
                        <div className="message-header">
                          <div>
                            <span className="message-name">{msg.relatedId.name || 'Utilisateur inconnu'}</span>
                            <span className="message-email">({msg.relatedId.email || 'Email manquant'})</span>
                          </div>
                          <span className={`message-badge ${msg.isRead ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {msg.isRead ? 'Répondu' : 'Non répondu'}
                          </span>
                        </div>
                        <div className="message-date">{new Date(msg.createdAt).toLocaleString()}</div>
                        <p className="message-content">{msg.message}</p>
                        <div className="message-actions">
                          {!msg.isRead && (
                            <Button
                              variant="primary"
                              className="reply-button me-2"
                              onClick={() => setSelectedNotification(msg)}
                            >
                              <BsReply className="me-1" /> Répondre
                            </Button>
                          )}
                          {msg.isRead && (
                            <Button
                              variant="danger"
                              className="delete-button"
                              onClick={() => setShowDeleteConfirm(msg)}
                            >
                              <BsTrash className="me-1" /> Supprimer
                            </Button>
                          )}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      <Modal
        show={!!selectedNotification}
        onHide={() => setSelectedNotification(null)}
        className="message-modal"
        centered
      >
        <Modal.Header closeButton className="message-modal-header">
          <Modal.Title>
            Réponse à {selectedNotification?.relatedId?.name || 'Utilisateur inconnu'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="message-modal-body">
          {selectedNotification && (
            <div className="original-message-content">
              <small>Message original :</small>
              <p className="mb-0 mt-2">{selectedNotification.message}</p>
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sujet</Form.Label>
              <Form.Control
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Objet de la réponse"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Votre message de réponse"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="message-modal-footer">
          <Button variant="secondary" onClick={() => setSelectedNotification(null)}>
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={handleReply}
            disabled={sending || !replySubject.trim() || !replyText.trim() || !selectedNotification?.relatedId}
          >
            {sending ? <><Spinner animation="border" size="sm" className="me-2" /> Envoi en cours...</> : 'Envoyer la réponse'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={!!showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(null)}
        className="delete-confirm-modal"
        centered
      >
        <Modal.Header closeButton className="delete-confirm-modal-header">
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body className="delete-confirm-modal-body">
          <p>
            Êtes-vous sûr de vouloir supprimer ce message de{' '}
            <strong>{showDeleteConfirm?.relatedId?.name || 'Utilisateur inconnu'}</strong> ?
          </p>
          <p className="text-muted">
            Email: {showDeleteConfirm?.relatedId?.email || 'Email manquant'}
            <br />
            <small>Cette action est irréversible.</small>
          </p>
        </Modal.Body>
        <Modal.Footer className="delete-confirm-modal-footer">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <><Spinner animation="border" size="sm" className="me-2" /> Suppression...</> : <><BsTrash className="me-1" /> Supprimer</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SupervisorMessages;