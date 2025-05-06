// src/pages/Settings.tsx
import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faSave, faUndo, faPalette, faBell, faShieldAlt, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../context/ThemeContext";
import "./Settings.css";

const Settings: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  const [language, setLanguage] = useState(localStorage.getItem("language") || "Français");
  const [emailNotifications, setEmailNotifications] = useState(
    localStorage.getItem("emailNotifications") !== "false"
  );
  const [pushNotifications, setPushNotifications] = useState(
    localStorage.getItem("pushNotifications") !== "false"
  );

  const handleSaveChanges = () => {
    localStorage.setItem("language", language);
    localStorage.setItem("emailNotifications", String(emailNotifications));
    localStorage.setItem("pushNotifications", String(pushNotifications));
    alert("Paramètres enregistrés avec succès !");
  };

  const handleReset = () => {
    setThemeMode("system");
    setLanguage("Français");
    setEmailNotifications(true);
    setPushNotifications(true);
  };

  return (
    <Container fluid className="settings-container">
      <Row>
        <Col lg={8} className="settings-content">
          <h2 className="settings-title">
            <FontAwesomeIcon icon={faCog} className="me-2" />
            Paramètres
          </h2>

          <Card className="settings-card">
            <Card.Body>
              <Card.Title>
                <FontAwesomeIcon icon={faPalette} className="me-2" />
                Paramètres généraux
              </Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Thème</Form.Label>
                  <div className="theme-selector">
                    <div 
                      className={`theme-option ${themeMode === "light" ? "active" : ""}`} 
                      onClick={() => setThemeMode("light")}
                    >
                      <FontAwesomeIcon icon={faSun} className="theme-icon" />
                      <span>Clair</span>
                    </div>
                    <div 
                      className={`theme-option ${themeMode === "dark" ? "active" : ""}`} 
                      onClick={() => setThemeMode("dark")}
                    >
                      <FontAwesomeIcon icon={faMoon} className="theme-icon" />
                      <span>Sombre</span>
                    </div>
                    <div 
                      className={`theme-option ${themeMode === "system" ? "active" : ""}`} 
                      onClick={() => setThemeMode("system")}
                    >
                      <FontAwesomeIcon icon={faCog} className="theme-icon" />
                      <span>Système</span>
                    </div>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Langue</Form.Label>
                  <Form.Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option>Français</option>
                    <option>English</option>
                    <option>Español</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

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
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="push-notifications"
                    label="Notifications push"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
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
                  <Form.Label>Changer le mot de passe</Form.Label>
                  <Form.Control type="password" placeholder="Nouveau mot de passe" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control type="password" placeholder="Confirmer le mot de passe" />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <div className="settings-actions mt-4">
            <Button variant="primary" onClick={handleSaveChanges}>
              <FontAwesomeIcon icon={faSave} className="me-2" />
              Enregistrer
            </Button>
            <Button variant="outline-secondary" onClick={handleReset} className="ms-2">
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