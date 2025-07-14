import { useEffect, useState } from "react";
import axios from "axios";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import "./EditUser.css";

const API_BASE_URL = "http://localhost:5000/api/admin/users";

const EditUser = ({ id, onClose }: { id: string; onClose: () => void }) => {
  const [userData, setUserData] = useState({ name: "", lastname: "", email: "", role: "user" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Aucun token d'authentification trouvé.");

        const response = await axios.get(`${API_BASE_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Ensure all expected fields are present
        setUserData({
          name: response.data.name || "",
          lastname: response.data.lastname || "",
          email: response.data.email || "",
          role: response.data.role || "user",
        });
      } catch (err) {
        setError("Échec de la récupération des données de l'utilisateur.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Aucun token d'authentification trouvé.");

      await axios.put(`${API_BASE_URL}/${id}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Utilisateur mis à jour avec succès !");
      onClose(); // Close modal only after success
    } catch (err) {
      setError("Échec de la mise à jour de l'utilisateur.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-user-spinner-container">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="edit-user-wrapper">
      {error && <Alert variant="danger" className="edit-user-alert">{error}</Alert>}
      {!loading && (
        <Form onSubmit={handleSubmit} className="edit-user-form-container">
          <Form.Group controlId="name" className="edit-user-form-group">
            <Form.Label className="edit-user-form-label">Prénom</Form.Label>
            <Form.Control
              type="text"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              className="edit-user-form-input"
              required
            />
          </Form.Group>

          <Form.Group controlId="lastname" className="edit-user-form-group">
            <Form.Label className="edit-user-form-label">Nom</Form.Label>
            <Form.Control
              type="text"
              value={userData.lastname}
              onChange={(e) => setUserData({ ...userData, lastname: e.target.value })}
              className="edit-user-form-input"
              required
            />
          </Form.Group>

          <Form.Group controlId="email" className="edit-user-form-group">
            <Form.Label className="edit-user-form-label">Email</Form.Label>
            <Form.Control
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              className="edit-user-form-input"
              required
            />
          </Form.Group>

          <Form.Group controlId="role" className="edit-user-form-group">
            <Form.Label className="edit-user-form-label">Rôle</Form.Label>
            <Form.Control
              as="select"
              value={userData.role}
              onChange={(e) => setUserData({ ...userData, role: e.target.value })}
              className="edit-user-form-input"
              required
            >
              <option value="user">Utilisateur</option>
              <option value="superviseur">Superviseur</option>
              <option value="admin">Administrateur</option>
            </Form.Control>
          </Form.Group>

          <div className="edit-user-button-group">
            <Button
              variant="secondary"
              onClick={onClose}
              className="edit-user-cancel-btn"
              disabled={submitLoading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="edit-user-submit-btn"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour"
              )}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default EditUser;