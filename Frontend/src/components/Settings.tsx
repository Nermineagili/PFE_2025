import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faSave, faUndo, faPalette, faBell, faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import axios, { AxiosError } from "axios";
import "./Settings.css";

interface UserSettings {
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
  return (error as AxiosError).isAxiosError === true;
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    language: "Français",
    emailNotifications: true,
    pushNotifications: true,
  });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  // Get userId and token from localStorage
  const userId = localStorage.getItem("userId") || "";
  const token = localStorage.getItem("authToken") || "";

  useEffect(() => {
    if (!userId || !token) {
      setError("Veuillez vous connecter pour accéder aux paramètres");
      return;
    }

    // Fetch user role and settings
    setLoading(true);
    setError("");
    
    // First get the user data to confirm role
    axios
      .get(`http://localhost:5000/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data.success) {
          const { role } = response.data.data;
          console.log('User role:', role);
          setRole(role);
          
          if (!["admin", "superviseur"].includes(role)) {
            setError("Accès réservé aux administrateurs et superviseurs");
            return Promise.reject("Unauthorized role");
          }
          
          // Now fetch settings
          return axios.get(`http://localhost:5000/api/settings/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          setError("Erreur lors du chargement des données utilisateur");
          return Promise.reject("User data error");
        }
      })
      .then((response) => {
        if (response?.data?.success && response?.data?.data) {
          console.log('Settings fetched:', response.data.data);
          const fetchedSettings = response.data.data;
          
          // Update settings with values from server
          setSettings({
            language: fetchedSettings.language || "Français",
            emailNotifications: fetchedSettings.emailNotifications !== undefined ? 
              fetchedSettings.emailNotifications : true,
            pushNotifications: fetchedSettings.pushNotifications !== undefined ? 
              fetchedSettings.pushNotifications : true
          });
        } else {
          console.warn('Settings response format unexpected:', response?.data);
        }
      })
      .catch((err: unknown) => {
        if (err === "Unauthorized role" || err === "User data error") {
          // Already handled these errors
          return;
        }
        
        if (isAxiosError(err)) {
          console.error('Fetch error:', err.response?.data);
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              "Erreur lors du chargement des paramètres"
          );
        } else {
          console.error('Unexpected error:', err);
          setError("Erreur lors du chargement des paramètres");
        }
      })
      .finally(() => setLoading(false));
  }, [userId, token]);

  const handleSaveChanges = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Save settings first
      console.log('Saving settings:', settings);
      const settingsResponse = await axios.put(
        `http://localhost:5000/api/settings/${userId}`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log('Settings update response:', settingsResponse.data);
      
      if (settingsResponse.data.success) {
        // Settings saved successfully, update state
        setSettings(settingsResponse.data.data);
        setSuccess("Paramètres enregistrés avec succès!");
        
        // If password fields are filled, try to change password
        if (newPassword && oldPassword) {
          try {
            console.log('Changing password');
            const passwordResponse = await axios.post(
              `http://localhost:5000/api/user/${userId}/change-password`,
              { oldPassword, newPassword },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            
            console.log('Password change response:', passwordResponse.data);
            
            if (passwordResponse.data.success) {
              setSuccess("Paramètres et mot de passe mis à jour avec succès!");
              // Clear password fields after successful change
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
            } else {
              setError(passwordResponse.data.message || "Erreur lors du changement de mot de passe");
            }
          } catch (passErr: unknown) {
            if (isAxiosError(passErr)) {
              console.error('Password change error:', passErr.response?.data);
              setError(
                passErr.response?.data?.message ||
                  passErr.response?.data?.error ||
                  "Erreur lors du changement de mot de passe"
              );
            } else {
              console.error('Unexpected password change error:', passErr);
              setError("Erreur lors du changement de mot de passe");
            }
          }
        }
      } else {
        setError(settingsResponse.data.message || "Erreur lors de l'enregistrement des paramètres");
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        console.error('Save error:', err.response?.data);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Erreur lors de l'enregistrement"
        );
      } else {
        console.error('Unexpected save error:', err);
        setError("Erreur lors de l'enregistrement");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      language: "Français",
      emailNotifications: true,
      pushNotifications: true,
    });
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  if (error && (!["admin", "superviseur"].includes(role) || !userId || !token)) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <Container fluid className={`settings-container ${loading ? "loading" : ""}`}>
      <Row>
        <Col lg={8} className="settings-content">
          <h2 className="settings-title">
            <FontAwesomeIcon icon={faCog} className="me-2" />
            Paramètres
          </h2>

          {/* <Card className="settings-card">
            <Card.Body>
              <Card.Title>
                <FontAwesomeIcon icon={faPalette} className="me-2" />
                Paramètres généraux
              </Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Langue</Form.Label>
                  <Form.Select
                    value={settings.language}
                    onChange={(e) => {
                      console.log('Language changed to:', e.target.value);
                      setSettings({ ...settings, language: e.target.value });
                    }}
                    disabled={loading}
                  >
                    <option value="Français">Français</option>
                    <option value="English">English</option>
                    <option value="Español">Español</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card> */}

          <Card className="settings-card mt-4">
            <Card.Body>
              <Card.Title>
                <FontAwesomeIcon icon={faBell} className="me-2" />
                Notifications
              </Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="email-notifications"
                    label="Notifications par email"
                    checked={settings.emailNotifications}
                    onChange={(e) => {
                      console.log('Email notifications changed to:', e.target.checked);
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      });
                    }}
                    disabled={loading}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="push-notifications"
                    label="Notifications push"
                    checked={settings.pushNotifications}
                    onChange={(e) => {
                      console.log('Push notifications changed to:', e.target.checked);
                      setSettings({
                        ...settings,
                        pushNotifications: e.target.checked,
                      });
                    }}
                    disabled={loading}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card className="settings-card mt-4">
            <Card.Body>
              <Card.Title>
                <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                Sécurité
              </Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Ancien mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Ancien mot de passe"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {error && <div className="error-message mt-3">{error}</div>}
          {success && <div className="success-message mt-3">{success}</div>}

          <div className="settings-actions mt-4">
            <Button
              variant="primary"
              onClick={handleSaveChanges}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSave} className="me-2" />
              Enregistrer
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleReset}
              className="ms-2"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faUndo} className="me-2" />
              Réinitialiser
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;