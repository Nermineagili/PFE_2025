// src/pages/Settings.tsx
import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faSave, faUndo, faPalette, faBell, faShieldAlt, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../context/ThemeContext";
import "./Settings.css";

const Settings: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  const [language, setLanguage] = useState(localStorage.getItem("language") || "English");
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
    alert("Settings saved successfully!");
  };

  const handleReset = () => {
    setThemeMode("system");
    setLanguage("English");
    setEmailNotifications(true);
    setPushNotifications(true);
  };

  return (
    <Container fluid className="settings-container">
      <Row>
        <Col lg={8} className="settings-content">
          <h2 className="settings-title">
            <FontAwesomeIcon icon={faCog} className="me-2" />
            Settings
          </h2>

          <Card className="settings-card">
            <Card.Body>
              <Card.Title>
                <FontAwesomeIcon icon={faPalette} className="me-2" />
                General Settings
              </Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Theme</Form.Label>
                  <div className="theme-selector">
                    <div 
                      className={`theme-option ${themeMode === "light" ? "active" : ""}`} 
                      onClick={() => setThemeMode("light")}
                    >
                      <FontAwesomeIcon icon={faSun} className="theme-icon" />
                      <span>Light</span>
                    </div>
                    <div 
                      className={`theme-option ${themeMode === "dark" ? "active" : ""}`} 
                      onClick={() => setThemeMode("dark")}
                    >
                      <FontAwesomeIcon icon={faMoon} className="theme-icon" />
                      <span>Dark</span>
                    </div>
                    <div 
                      className={`theme-option ${themeMode === "system" ? "active" : ""}`} 
                      onClick={() => setThemeMode("system")}
                    >
                      <FontAwesomeIcon icon={faCog} className="theme-icon" />
                      <span>System</span>
                    </div>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Language</Form.Label>
                  <Form.Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option>English</option>
                    <option>French</option>
                    <option>Spanish</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Rest of your Settings component remains the same */}
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;