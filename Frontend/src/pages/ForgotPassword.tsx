import { useState } from "react";
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./ForgotPassword.css"; // Create a matching CSS file

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email
      });
      
      setSuccess(true);
      setMessage(`
        Votre demande de réinitialisation de mot de passe a été soumise.
        Un administrateur examinera votre demande sous peu.
        Une fois approuvée, vous recevrez un email à l'adresse ${email} avec les instructions de réinitialisation.
      `);
    } catch (err: any) {
      console.error("Échec de la demande de réinitialisation:", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || "Échec de la soumission de la demande"
          : err instanceof Error
            ? err.message
            : "Une erreur inattendue s'est produite"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <Card className="forgot-password-card">
        <Card.Header as="h5">
          <FaEnvelope className="me-2" /> Mot de passe oublié
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          {success ? (
            <Alert variant="success">
              <h5>Demande soumise</h5>
              <p>{message}</p>
              <div className="text-center mt-3">
                <Link to="/signin" className="btn btn-primary">
                  Retour à la connexion
                </Link>
              </div>
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Adresse email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Entrez votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  Entrez l'adresse email associée à votre compte.
                </Form.Text>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Envoi en cours...
                    </>
                  ) : (
                    "Soumettre la demande"
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
        <Card.Footer className="text-center">
          <Link to="/signin">Retour à la connexion</Link>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default ForgotPassword;