import React, { useEffect, useState } from 'react';
import { Container, Card, ListGroup, Button, Spinner, Form, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdsupNavbar from './AdsupNavbar';
import './SupervisorMessages.css';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  relatedId: { _id: string; name: string; email: string };
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

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contactMessages = response.data.filter((n: Notification) => n.type === 'contact_message');
      setNotifications(contactMessages);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setAlert({ type: 'danger', text: 'Failed to load messages. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleReply = async () => {
    if (!selectedNotification) return;
    setSending(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      // Send reply (assumes backend endpoint)
      await axios.post(
        'http://localhost:5000/api/contact/reply',
        {
          to: selectedNotification.relatedId.email,
          subject: replySubject,
          message: replyText,
          notificationId: selectedNotification._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mark notification as read
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
      console.error('Error sending reply:', error);
      setAlert({ type: 'danger', text: 'Failed to send reply. Please try again later.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="supervisor-messages-layout">
      <AdsupNavbar />
      <div className="supervisor-messages-content">
        <Container className="py-4 mt-5">
          <Card className="messages-card">
            <Card.Header className="messages-card-header d-flex justify-content-between align-items-center">
              <h2 className="messages-title mb-0">Boîte de réception</h2>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => fetchNotifications()}
              >
                Actualiser
              </Button>
            </Card.Header>
            <Card.Body>
              {alert && (
                <Alert variant={alert.type} className="messages-alert" dismissible onClose={() => setAlert(null)}>
                  {alert.text}
                </Alert>
              )}

              {loading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-center p-4">Aucun message trouvé.</p>
              ) : (
                <ListGroup className="message-list">
                  {notifications.map((msg) => (
                    <ListGroup.Item key={msg._id} className="message-item">
                      <div className="message-header">
                        <div>
                          <span className="message-name">{msg.relatedId.name}</span>
                          <span className="message-email">({msg.relatedId.email})</span>
                        </div>
                        <span className={`message-badge ${msg.isRead ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {msg.isRead ? 'Répondu' : 'Non répondu'}
                        </span>
                      </div>
                      <div className="message-date">{new Date(msg.createdAt).toLocaleString()}</div>
                      <p className="message-content">{msg.message}</p>
                      {!msg.isRead && (
                        <div className="message-actions">
                          <Button
                            variant="primary"
                            className="reply-button"
                            onClick={() => setSelectedNotification(msg)}
                          >
                            Répondre
                          </Button>
                        </div>
                      )}
                    </ListGroup.Item>
                  ))}
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
          <Modal.Title>Réponse à {selectedNotification?.relatedId.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="message-modal-body">
          {selectedNotification && (
            <div className="original-message-content p-3 mb-3">
              <small>Message original :</small>
              <p className="mb-0 mt-1">{selectedNotification.message}</p>
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
            disabled={sending || !replySubject.trim() || !replyText.trim()}
          >
            {sending ? <Spinner animation="border" size="sm" /> : 'Envoyer la réponse'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SupervisorMessages;