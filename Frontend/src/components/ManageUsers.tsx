import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Alert, Spinner, Card, Container, Modal, OverlayTrigger, Tooltip} from "react-bootstrap";
import { FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';
import EditUser from "./EditUser";
import "./ManageUsers.css";

interface User {
  _id: string;
  name: string;
  lastname: string;
  email: string;
  createdAt: string; // Added to match claims structure
}

const API_BASE_URL = "http://localhost:5000/api/admin/users";

function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await axios.get<User[]>(`${API_BASE_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data || !Array.isArray(response.data)) throw new Error("Invalid API response format");
      
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users.");
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



  const deleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user._id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };



  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Container className="manage-users-container">
      <Card className="manage-users-card">
        <Card.Body>
          <h2 className="manage-users-title">Manage Users</h2>

          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {error && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}

          {!loading && !error && users.length === 0 && (
            <Alert variant="info" className="text-center">
              No users found
            </Alert>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="table-responsive">
              <Table hover className="manage-users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
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
                      <td className="actions-cell">
                        <OverlayTrigger overlay={<Tooltip id={`edit-tooltip-${user._id}`}>Edit User</Tooltip>}>
                          <Button
                            size="sm"
                            className="action-btn analyze-btn"
                            onClick={() => handleEditUser(user._id)}
                          >
                            <FaRegEdit />
                          </Button>
                        </OverlayTrigger>
                        
                      
                           
                         
                        <OverlayTrigger overlay={<Tooltip id={`delete-tooltip-${user._id}`}>Delete</Tooltip>}>
                          <Button
                            size="sm"
                            className="action-btn delete-btn"
                            onClick={() => deleteUser(user._id)}
                          >
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

      {/* Edit User Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered className="user-modal">
        <Modal.Header closeButton className="modal-header">
          <Modal.Title className="modal-title">
            Edit User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          {selectedUserId && <EditUser id={selectedUserId} onClose={handleCloseModal} />}
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button 
            variant="secondary" 
            onClick={handleCloseModal}
            className="close-button"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ManageUsers;