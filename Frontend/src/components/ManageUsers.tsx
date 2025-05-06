import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Alert, Spinner, Card, Container, Modal, OverlayTrigger, Tooltip, Form, Row, Col } from "react-bootstrap";
import { FaRegEdit, FaRegTrashAlt, FaFilter, FaUserCheck, FaUserPlus, FaKey } from 'react-icons/fa';
import EditUser from "./EditUser";
import ResetPasswordApproval from "../pages/ResetPasswordApproval";
import { useLocation } from "react-router-dom";
import "./ManageUsers.css";

interface User {
  _id: string;
  name: string;
  lastname: string;
  email: string;
  createdAt: string;
  role?: string;
}

interface NewUserData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
}

// Fonction pour extraire le token et l'ID utilisateur de l'URL
const extractResetParams = () => {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split('/');
  
  // Vérifie si c'est une URL d'approbation de réinitialisation admin
  if (pathParts.includes('approve-reset')) {
    const token = pathParts[pathParts.indexOf('approve-reset') + 1];
    const userId = pathParts[pathParts.indexOf('approve-reset') + 2];
    
    return { token, userId };
  }
  
  return { token: null, userId: null };
};

const API_BASE_URL = "http://localhost:5000/api/admin/users";
const API_BASE_URL2 = "http://localhost:5000/api/admin";

function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filterContracts, setFilterContracts] = useState<boolean>(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [addUserFormData, setAddUserFormData] = useState<NewUserData>({
    name: "",
    lastname: "",
    email: "",
    password: "",
    role: "user"
  });
  const [addUserLoading, setAddUserLoading] = useState<boolean>(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);
  
  // Pour l'approbation de réinitialisation de mot de passe
  const [showResetSection, setShowResetSection] = useState<boolean>(false);
  const location = useLocation();
  const { token: resetToken, userId: resetUserId } = extractResetParams();

  // Si un token de réinitialisation est dans l'URL, affiche automatiquement la section d'approbation
  useEffect(() => {
    if (resetToken && resetUserId) {
      setShowResetSection(true);
    }
  }, [resetToken, resetUserId]);


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Aucun token d'authentification trouvé.");

      // D'abord, obtenir le nombre total d'utilisateurs comme référence
      if (!totalUsers) {
        const allUsersResponse = await axios.get<User[]>(`${API_BASE_URL}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (Array.isArray(allUsersResponse.data)) {
          setTotalUsers(allUsersResponse.data.length);
        }
      }

      // Puis obtenir soit les utilisateurs filtrés soit tous selon le paramètre de filtre
      const url = filterContracts
        ? `${API_BASE_URL2}/users-with-contracts-only`
        : `${API_BASE_URL}`;

      const response = await axios.get<User[]>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data || !Array.isArray(response.data)) throw new Error("Format de réponse API invalide");

      setUsers(response.data);
      setFilteredCount(response.data.length);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      setError("Échec de la récupération des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (id: string) => {
    setSelectedUserId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUserId(null);
    fetchUsers();
  };

  const handleAddUserModal = () => {
    setShowAddModal(true);
    // Réinitialiser le formulaire et les messages lors de l'ouverture de la modal
    setAddUserFormData({
      name: "",
      lastname: "",
      email: "",
      password: "",
      role: "user"
    });
    setAddUserError(null);
    setAddUserSuccess(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddUserFormData({
      ...addUserFormData,
      [name]: value
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddUserFormData({
      ...addUserFormData,
      [name]: value
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError(null);
    setAddUserSuccess(null);
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Aucun token d'authentification trouvé.");

      const response = await axios.post(
        `${API_BASE_URL}`, 
        addUserFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAddUserSuccess("Utilisateur créé avec succès !");
      // Réinitialiser le formulaire
      setAddUserFormData({
        name: "",
        lastname: "",
        email: "",
        password: "",
        role: "user"
      });
      
      // Actualiser la liste des utilisateurs
      fetchUsers();
      
      // Fermer la modal après un court délai pour afficher le message de succès
      setTimeout(() => {
        setShowAddModal(false);
      }, 1500);
      
    } catch (err: any) {
      console.error("Erreur lors de la création de l'utilisateur:", err);
      setAddUserError(err.response?.data?.error || "Échec de la création de l'utilisateur.");
    } finally {
      setAddUserLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Aucun token d'authentification trouvé.");

      await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user._id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      alert("Échec de la suppression de l'utilisateur.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterContracts]); // recharger quand le filtre change

  return (
    <Container className="manage-users-container">
      {/* Section d'approbation de réinitialisation de mot de passe */}
      {/* {showResetSection && (
  <ResetPasswordApproval 
    tokenFromURL={resetToken}  
    userIdFromURL={resetUserId} 
  />
)} */}

      {/* Bouton pour basculer la section des demandes de réinitialisation */}
      <div className="d-flex justify-content-end mb-3">
        <Button 
          variant={showResetSection ? "outline-secondary" : "outline-primary"}
          onClick={() => setShowResetSection(!showResetSection)}
          className="toggle-reset-btn"
        >
          <FaKey className="me-2" />
          {showResetSection ? "Masquer les demandes de réinitialisation" : "Afficher les demandes de réinitialisation"}
        </Button>
      </div>

      <Card className="manage-users-card">
        <Card.Body>
          <div className="manage-users-header">
            <h2 className="manage-users-title">Gestion des utilisateurs</h2>
            <Button 
              variant="primary" 
              className="manage-users-add-btn"
              onClick={handleAddUserModal}
            >
              <FaUserPlus className="me-2" /> Ajouter un utilisateur
            </Button>
          </div>

          {/* Sélecteur de filtre amélioré */}
          <div className="manage-users-filter-container">
            <div className="manage-users-filter-title">
              <FaFilter className="manage-users-filter-icon" />
              {filterContracts ? 'Affichage des utilisateurs avec contrats' : 'Affichage de tous les utilisateurs'}
              {!loading && (
                <span className="manage-users-filter-count">
                  {filterContracts ? filteredCount : totalUsers}
                </span>
              )}
            </div>
            
            <div className="manage-users-filter-switch">
              <Form.Check
                type="switch"
                id="filter-contracts-switch"
                label="Afficher uniquement les utilisateurs avec contrats"
                checked={filterContracts}
                onChange={() => setFilterContracts(!filterContracts)}
                className="manage-users-custom-switch"
              />
            </div>
          </div>

          {loading && (
            <div className="manage-users-loading-spinner text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {error && (
            <Alert variant="danger" className="manage-users-error text-center">
              {error}
            </Alert>
          )}

          {!loading && !error && users.length === 0 && (
            <Alert variant="info" className="manage-users-no-users text-center">
              <FaUserCheck className="manage-users-no-users-icon mb-2" size={32} />
              <p className="mb-0">Aucun utilisateur trouvé correspondant aux critères de filtre actuels</p>
            </Alert>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="manage-users-table-responsive">
              <Table hover className="manage-users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user._id}>
                      <td>{index + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.lastname}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role || 'user'}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="manage-users-actions-cell">
                        <OverlayTrigger overlay={<Tooltip>Modifier l'utilisateur</Tooltip>}>
                          <Button size="sm" className="manage-users-action-btn manage-users-analyze-btn" onClick={() => handleEditUser(user._id)}>
                            <FaRegEdit />
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger overlay={<Tooltip>Supprimer</Tooltip>}>
                          <Button size="sm" className="manage-users-action-btn manage-users-delete-btn" onClick={() => deleteUser(user._id)}>
                            <FaRegTrashAlt />
                          </Button>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal d'édition */}
      <Modal show={showModal} onHide={handleCloseModal} centered className="manage-users-modal">
        <Modal.Header closeButton className="manage-users-modal-header">
          <Modal.Title className="manage-users-modal-title">Modifier l'utilisateur</Modal.Title>
        </Modal.Header>
        <Modal.Body className="manage-users-modal-body">
          {selectedUserId && <EditUser id={selectedUserId} onClose={handleCloseModal} />}
        </Modal.Body>
        <Modal.Footer className="manage-users-modal-footer">
          <Button variant="secondary" onClick={handleCloseModal} className="manage-users-close-button">
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal d'ajout d'utilisateur */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered className="manage-users-modal add-user-modal">
        <Modal.Header closeButton className="manage-users-modal-header">
          <Modal.Title className="manage-users-modal-title">
            <FaUserPlus className="me-2" /> Ajouter un nouvel utilisateur
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="manage-users-modal-body">
          {addUserError && (
            <Alert variant="danger" className="mb-3">
              {addUserError}
            </Alert>
          )}
          
          {addUserSuccess && (
            <Alert variant="success" className="mb-3">
              {addUserSuccess}
            </Alert>
          )}
          
          <Form onSubmit={handleAddUser}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={addUserFormData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez le prénom"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="lastname" 
                    value={addUserFormData.lastname}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez le nom"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email" 
                value={addUserFormData.email}
                onChange={handleInputChange}
                required
                placeholder="Entrez l'email"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control 
                type="password" 
                name="password" 
                value={addUserFormData.password}
                onChange={handleInputChange}
                required
                placeholder="Entrez le mot de passe"
                minLength={6}
              />
              <Form.Text className="text-muted">
                Le mot de passe doit contenir au moins 6 caractères
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Rôle</Form.Label>
              <Form.Select 
                name="role" 
                value={addUserFormData.role}
                onChange={handleSelectChange}
                required
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
                <option value="superviseur">Superviseur</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" onClick={handleCloseAddModal} className="me-2">
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={addUserLoading}
              >
                {addUserLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Création en cours...
                  </>
                ) : (
                  "Créer l'utilisateur"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default ManageUsers;