import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Alert, Spinner, Card, Container, Modal, OverlayTrigger, Tooltip, Form } from "react-bootstrap";
import { FaRegEdit, FaRegTrashAlt, FaFilter, FaUserCheck } from 'react-icons/fa';
import EditUser from "./EditUser";
import "./ManageUsers.css";

interface User {
  _id: string;
  name: string;
  lastname: string;
  email: string;
  createdAt: string;
}

const API_BASE_URL = "http://localhost:5000/api/admin/users";
const API_BASE_URL2 = "http://localhost:5000/api/admin";

function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filterContracts, setFilterContracts] = useState<boolean>(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      // First, get total users count for reference
      if (!totalUsers) {
        const allUsersResponse = await axios.get<User[]>(`${API_BASE_URL}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (Array.isArray(allUsersResponse.data)) {
          setTotalUsers(allUsersResponse.data.length);
        }
      }

      // Then get either filtered or all users based on filter setting
      const url = filterContracts
        ? `${API_BASE_URL2}/users-with-contracts-only`
        : `${API_BASE_URL}`;

      const response = await axios.get<User[]>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data || !Array.isArray(response.data)) throw new Error("Invalid API response format");

      setUsers(response.data);
      setFilteredCount(response.data.length);
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
  }, [filterContracts]); // re-fetch when the filter changes

  return (
    <Container className="manage-users-container">
      <Card className="manage-users-card">
        <Card.Body>
          <h2 className="manage-users-title">Manage Users</h2>

          {/* Enhanced Filter Toggle */}
          <div className="filter-container">
            <div className="filter-title">
              <FaFilter className="filter-icon" />
              {filterContracts ? 'Showing users with contracts' : 'Showing all users'}
              {!loading && (
                <span className="filter-count">
                  {filterContracts ? filteredCount : totalUsers}
                </span>
              )}
            </div>
            
            <div className="filter-switch">
              <Form.Check
                type="switch"
                id="filter-contracts-switch"
                label="Show only users with contracts"
                checked={filterContracts}
                onChange={() => setFilterContracts(!filterContracts)}
                className="custom-switch"
              />
            </div>
          </div>

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
              <FaUserCheck className="mb-2" size={32} />
              <p className="mb-0">No users found matching the current filter criteria</p>
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
                        <OverlayTrigger overlay={<Tooltip>Edit User</Tooltip>}>
                          <Button size="sm" className="action-btn analyze-btn" onClick={() => handleEditUser(user._id)}>
                            <FaRegEdit />
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
                          <Button size="sm" className="action-btn delete-btn" onClick={() => deleteUser(user._id)}>
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

      {/* Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered className="user-modal">
        <Modal.Header closeButton className="modal-header">
          <Modal.Title className="modal-title">Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          {selectedUserId && <EditUser id={selectedUserId} onClose={handleCloseModal} />}
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button variant="secondary" onClick={handleCloseModal} className="close-button">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ManageUsers;