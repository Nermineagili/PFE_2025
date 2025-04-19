import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, ListGroup, Button, Spinner, Form, Alert, Modal } from "react-bootstrap";
import AdsupNavbar from './AdsupNavbar';
import './SupervisorMessages.css';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:5000/api/contact";

interface Message {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  replied: boolean;
  replyMessage?: string;
}

const SupervisorMessages: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyText, setReplyText] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "danger"; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  // Fetch messages from the backend
  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setAlert({ type: "danger", text: "Failed to fetch messages. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Check if user is logged in and has supervisor role
    // This is just a placeholder - implement according to your auth system
    const checkAccess = async () => {
      try {
        // Example: Check user role from your auth context or API
        // const { data } = await axios.get('/api/auth/check-role');
        // if (data.role !== 'supervisor') {
        //   navigate('/dashboard');
        // }
      } catch (error) {
        // Handle authentication errors
        // navigate('/login');
      }
    };
    
    checkAccess();
  }, [navigate]);

  const handleReply = async () => {
    if (!selectedMessage) return;
    setSending(true);
    try {
      await axios.post(`${API_URL}/reply`, {
        to: selectedMessage.email,
        subject: replySubject,
        message: replyText,
        messageId: selectedMessage._id,
      });
      setAlert({ type: "success", text: "Reply sent successfully." });
      setSelectedMessage(null);
      setReplySubject("");
      setReplyText("");
      fetchMessages(); // Refresh the messages list
    } catch (error) {
      setAlert({ type: "danger", text: "Error sending reply. Try again later." });
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
              <h2 className="messages-title mb-0">Supervisor Inbox</h2>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => fetchMessages()}
              >
                Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              {alert && <Alert variant={alert.type} className="messages-alert" dismissible onClose={() => setAlert(null)}>{alert.text}</Alert>}

              {loading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" />
                </div>
              ) : (
                <ListGroup className="message-list">
                  {messages.length === 0 ? (
                    <p className="text-center p-4">No messages found.</p>
                  ) : (
                    messages.map((msg) => (
                      <ListGroup.Item key={msg._id} className="message-item">
                        <div className="message-header">
                          <div>
                            <span className="message-name">{msg.name}</span>
                            <span className="message-email">({msg.email})</span>
                          </div>
                          <span className={`message-badge ${msg.replied ? "bg-success" : "bg-warning text-dark"}`}>
                            {msg.replied ? "Replied" : "Not Replied"}
                          </span>
                        </div>
                        <div className="message-date">{new Date(msg.createdAt).toLocaleString()}</div>
                        <p className="message-content">{msg.message}</p>
                        
                        {!msg.replied && (
                          <div className="message-actions">
                            <Button 
                              variant="primary" 
                              className="reply-button"
                              onClick={() => setSelectedMessage(msg)}
                            >
                              Reply
                            </Button>
                          </div>
                        )}
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Reply Modal */}
      <Modal 
        show={!!selectedMessage} 
        onHide={() => setSelectedMessage(null)}
        className="message-modal"
        centered
      >
        <Modal.Header closeButton className="message-modal-header">
          <Modal.Title>Reply to {selectedMessage?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="message-modal-body">
          {selectedMessage && (
            <div className="original-message-content p-3 mb-3">
              <small>Original message:</small>
              <p className="mb-0 mt-1">{selectedMessage.message}</p>
            </div>
          )}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Subject of the reply"
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
                placeholder="Your reply message"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="message-modal-footer">
          <Button variant="secondary" onClick={() => setSelectedMessage(null)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleReply} 
            disabled={sending || !replySubject.trim() || !replyText.trim()}
          >
            {sending ? <Spinner animation="border" size="sm" /> : "Send Reply"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SupervisorMessages;