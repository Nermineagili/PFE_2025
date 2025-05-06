import { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaLock } from "react-icons/fa";
import "./ResetPassword.css"; // Create a matching CSS file

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<string>("weak");

  // Validate token on page load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Lien de réinitialisation invalide. Veuillez demander un nouveau lien.");
        setValidating(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/auth/reset-password/${token}`
        );
        
        setUserEmail(response.data.email);
        setValidating(false);
      } catch (err) {
        console.error("Échec de la validation du token:", err);
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.error || "Lien de réinitialisation invalide ou expiré"
            : err instanceof Error
              ? err.message
              : "Une erreur inattendue s'est produite"
        );
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength("weak");
      return;
    }

    // Simple password strength checker
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = 
      (hasUpperCase ? 1 : 0) +
      (hasLowerCase ? 1 : 0) +
      (hasNumbers ? 1 : 0) +
      (hasSpecialChar ? 1 : 0) +
      (isLongEnough ? 1 : 0);

    if (strength < 3) setPasswordStrength("faible");
    else if (strength < 5) setPasswordStrength("moyen");
    else setPasswordStrength("fort");
  }, [password]);

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case "faible": return "danger";
      case "moyen": return "warning";
      case "fort": return "success";
      default: return "danger";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { token, password, confirmPassword }
      );
      
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/signin");
      }, 3000);
    } catch (err) {
      console.error("Échec de la réinitialisation du mot de passe:", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || "Échec de la réinitialisation du mot de passe"
          : err instanceof Error
            ? err.message
            : "Une erreur inattendue s'est produite"
      );
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="reset-password-container">
        <Card className="reset-password-card">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Validation du lien de réinitialisation en cours...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <Card className="reset-password-card">
        <Card.Header as="h5">
        <FaLock className="me-2" /> Réinitialiser le mot de passe
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          {success ? (
            <Alert variant="success">
              <h5>Réinitialisation réussie !</h5>
              <p>
                Votre mot de passe a été réinitialisé avec succès. Vous serez redirigé vers la page de connexion dans quelques secondes.
              </p>
              <div className="text-center mt-3">
                <Link to="/signin" className="btn btn-primary">
                  Aller à la connexion
                </Link>
              </div>
            </Alert>
          ) : (
            <>
              {userEmail && (
                <Alert variant="info" className="mb-4">
                  Réinitialisation du mot de passe pour : <strong>{userEmail}</strong>
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Entrez votre nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  {password && (
                    <div className="password-strength mt-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <small>Force du mot de passe :</small>
                        <small className={`text-${getStrengthColor()}`}>
                          {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                        </small>
                      </div>
                      <div className="progress" style={{ height: "5px" }}>
                        <div
                          className={`progress-bar bg-${getStrengthColor()}`}
                          role="progressbar"
                          style={{ 
                            width: passwordStrength === "faible" ? "33%" : 
                                   passwordStrength === "moyen" ? "66%" : "100%" 
                          }}
                          aria-valuenow={
                            passwordStrength === "faible" ? 33 : 
                            passwordStrength === "moyen" ? 66 : 100
                          }
                          aria-valuemin={0}
                          aria-valuemax={100}
                        ></div>
                      </div>
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirmer le mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirmez votre nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    isInvalid={confirmPassword !== "" && password !== confirmPassword}
                  />
                  {confirmPassword !== "" && password !== confirmPassword && (
                    <Form.Control.Feedback type="invalid">
                      Les mots de passe ne correspondent pas
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading || password !== confirmPassword || password.length < 8}
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
                        Réinitialisation en cours...
                      </>
                    ) : (
                      "Réinitialiser le mot de passe"
                    )}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ResetPassword;