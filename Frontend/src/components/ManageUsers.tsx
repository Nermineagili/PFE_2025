import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Alert, Spinner, Card, Container, Modal, OverlayTrigger, Tooltip, Form, Row, Col } from "react-bootstrap";
import { FaRegEdit, FaRegTrashAlt, FaFilter, FaUserCheck, FaUserPlus } from 'react-icons/fa';
import EditUser from "./EditUser";
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

  const handleAddUserModal = () => {
    setShowAddModal(true);
    // Reset form and messages when opening the modal
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
      if (!token) throw new Error("No authentication token found.");

      const response = await axios.post(
        `${API_BASE_URL}`, 
        addUserFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAddUserSuccess("User created successfully!");
      // Reset form
      setAddUserFormData({
        name: "",
        lastname: "",
        email: "",
        password: "",
        role: "user"
      });
      
      // Refresh user list
      fetchUsers();
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        setShowAddModal(false);
      }, 1500);
      
    } catch (err: any) {
      console.error("Error creating user:", err);
      setAddUserError(err.response?.data?.error || "Failed to create user.");
    } finally {
      setAddUserLoading(false);
    }
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
          <div className="manage-users-header">
            <h2 className="manage-users-title">Manage Users</h2>
            <Button 
              variant="primary" 
              className="manage-users-add-btn"
              onClick={handleAddUserModal}
            >
              <FaUserPlus className="me-2" /> Add New User
            </Button>
          </div>

          {/* Enhanced Filter Toggle */}
          <div className="manage-users-filter-container">
            <div className="manage-users-filter-title">
              <FaFilter className="manage-users-filter-icon" />
              {filterContracts ? 'Showing users with contracts' : 'Showing all users'}
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
                label="Show only users with contracts"
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
              <p className="mb-0">No users found matching the current filter criteria</p>
            </Alert>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="manage-users-table-responsive">
              <Table hover className="manage-users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Role</th>
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
                        <OverlayTrigger overlay={<Tooltip>Edit User</Tooltip>}>
                          <Button size="sm" className="manage-users-action-btn manage-users-analyze-btn" onClick={() => handleEditUser(user._id)}>
                            <FaRegEdit />
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
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

      {/* Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered className="manage-users-modal">
        <Modal.Header closeButton className="manage-users-modal-header">
          <Modal.Title className="manage-users-modal-title">Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body className="manage-users-modal-body">
          {selectedUserId && <EditUser id={selectedUserId} onClose={handleCloseModal} />}
        </Modal.Body>
        <Modal.Footer className="manage-users-modal-footer">
          <Button variant="secondary" onClick={handleCloseModal} className="manage-users-close-button">
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add User Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered className="manage-users-modal add-user-modal">
        <Modal.Header closeButton className="manage-users-modal-header">
          <Modal.Title className="manage-users-modal-title">
            <FaUserPlus className="me-2" /> Add New User
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
                  <Form.Label>First Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={addUserFormData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter first name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="lastname" 
                    value={addUserFormData.lastname}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter last name"
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
                placeholder="Enter email"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                name="password" 
                value={addUserFormData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter password"
                minLength={6}
              />
              <Form.Text className="text-muted">
                Password must be at least 6 characters long
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select 
                name="role" 
                value={addUserFormData.role}
                onChange={handleSelectChange}
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superviseur">Supervisor</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" onClick={handleCloseAddModal} className="me-2">
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={addUserLoading}
              >
                {addUserLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  "Create User"
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