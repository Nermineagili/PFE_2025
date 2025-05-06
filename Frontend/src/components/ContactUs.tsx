import { useState, forwardRef } from "react";
import axios from "axios";
import { Form, Button, Alert, Container, Card, Spinner } from "react-bootstrap";
import "./ContactUs.css";
import React from "react";

const API_URL = "http://localhost:5000/api/contact";

const ContactUs = forwardRef<HTMLDivElement>((_props, ref) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(API_URL, formData);
      setSuccess(response.data.message);
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      setError("Échec de l'envoi du message. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={ref} id="contactus-section" className="contactus-section">
      <Container className="contact-container">
        <Card className="contact-card">
          <Card.Body>
            <h2 className="text-center contact-title">Contactez-nous</h2>
            <p className="text-center contact-subtitle">
              Vous avez des questions ? N'hésitez pas à nous contacter !
            </p>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit} className="contact-form">
              <Form.Group controlId="name">
                <Form.Label>Votre nom</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Entrez votre nom"
                  required
                />
              </Form.Group>

              <Form.Group controlId="email">
                <Form.Label>Votre adresse e-mail</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Entrez votre adresse e-mail"
                  required
                />
              </Form.Group>

              <Form.Group controlId="message">
                <Form.Label>Votre message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tapez votre message ici..."
                  required
                />
              </Form.Group>

              <div className="d-flex justify-content-center">
                <Button className="send-button" type="submit" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : "Envoyer le message"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </section>
  );
});

export default ContactUs;
