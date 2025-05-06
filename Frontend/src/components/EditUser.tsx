import { useEffect, useState } from "react";
import axios from "axios";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import './EditUser.css';

const API_BASE_URL = "http://localhost:5000/api/admin/users";

const EditUser = ({ id, onClose }: { id: string; onClose: () => void }) => {
  const [userData, setUserData] = useState({ name: "", lastname: "", email: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Récupérer les données utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found.");

        const response = await axios.get(`${API_BASE_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
      } catch (err) {
        setError("Échec de la récupération des données de l'utilisateur.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  // Soumettre le formulaire
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      await axios.put(`${API_BASE_URL}/${id}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Utilisateur mis à jour avec succès !");
      onClose(); // Fermer la fenêtre après la mise à jour
    } catch (err) {
      setError("Échec de la mise à jour de l'utilisateur.");
    }
  };

  return (
    <div className="edit-user-wrapper">
      {loading && (
        <div className="edit-user-spinner-container">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && (
        <Alert variant="danger" className="edit-user-alert">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Form onSubmit={handleSubmit} className="edit-user-form-container">
          <Form.Group controlId="name" className="edit-user-form-group">
            <Form.Label className="edit-user-form-label">Prénom</Form.Label>
            <Form.Control
              type="text"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              className="edit-user-form-input"
            />
          </Form.Group>

          <Form.Group controlId="lastname" className="edit-user-form-group">
            <Form.Label className="edit-user-form-label">Nom</Form.Label>
            <Form.Control
              type="text"
              value={userData.lastname}
              onChange={(e) => setUserData({ ...userData, lastname: e.target.value })}
              className="edit-user-form-input"
            />
          </Form.Group>

          <Form.Group controlId="email" className="edit-user-form-group">
            <Form.Label className="edit-user-form-label">Email</Form.Label>
            <Form.Control
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              className="edit-user-form-input"
            />
          </Form.Group>

          <div className="edit-user-button-group">
            <Button
              variant="secondary"
              onClick={onClose}
              className="edit-user-cancel-btn"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="edit-user-submit-btn"
            >
              Mettre à jour
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default EditUser;
