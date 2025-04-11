import React, { useState } from 'react';
import { Modal, Form, Button, Tab, Tabs } from 'react-bootstrap';
import { MdSave, MdLock, MdPerson, MdEmail, MdBadge } from 'react-icons/md';
import { FiEdit2, FiCheck } from 'react-icons/fi';
import ImageUpload from './ImageUpload';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './UserProfileModal.css';

const API_URL = 'http://localhost:5000/api/user/';

interface UserProfileModalProps {
  show: boolean;
  onHide: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ show, onHide }) => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);

  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    lastname: user?.lastname || '',
    email: user?.email || '',
    role: user?.role || 'user'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      if (!user) return;
      const token = localStorage.getItem('authToken'); // Fetch the token
    
      const response = await axios.put(`${API_URL}${user._id}`, {
        ...editedUser,
        profilePic
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    
      login(token || '', response.data);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      if (!user) return;
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_URL}change-password/${user._id}`, passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPasswordError('');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      const successEvent = new CustomEvent('showToast', {
        detail: {
          message: 'Password changed successfully!',
          variant: 'success'
        }
      });
      window.dispatchEvent(successEvent);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.error || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setProfilePic(imageUrl); // Update local state
  
    if (user) {
      const updatedUser = { ...user, profilePic: imageUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Update local storage
      login(localStorage.getItem("authToken") || "", updatedUser); // Update global auth context
    }
  };
  

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="profile-modal">
      <Modal.Header closeButton className="modal-header">
        <Modal.Title className="modal-title">
          <MdPerson className="title-icon" />
          My Profile
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'profile')} className="profile-tabs">
          {/* Profile Tab */}
          <Tab eventKey="profile" title={<><MdPerson /> Profile</>} className="profile-tab">
            <div className="profile-content">
              <div className="profile-image-section">
                
                <ImageUpload onImageUpload={handleImageUpload}  />
              </div>
              
              <Form className="profile-form">
                <Form.Group className="form-group">
                  <Form.Label className="form-label">
                    <MdBadge className="input-icon" />
                    First Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    className="form-input"
                    disabled={!editMode}
                  />
                </Form.Group>

                <Form.Group className="form-group">
                  <Form.Label className="form-label">
                    <MdBadge className="input-icon" />
                    Last Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editedUser.lastname}
                    onChange={(e) => setEditedUser({ ...editedUser, lastname: e.target.value })}
                    className="form-input"
                    disabled={!editMode}
                  />
                </Form.Group>

                <Form.Group className="form-group">
                  <Form.Label className="form-label">
                    <MdEmail className="input-icon" />
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    className="form-input"
                    disabled={!editMode}
                  />
                </Form.Group>

                <Form.Group className="form-group">
                  <Form.Label className="form-label">Role</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editedUser.role} 
                    readOnly 
                    disabled 
                    className="form-input"
                  />
                </Form.Group>

                <div className="form-actions">
                  {editMode ? (
                    <>
                      <Button 
                        variant="primary" 
                        onClick={handleSaveProfile} 
                        disabled={isUpdatingProfile}
                        className="save-button"
                      >
                        {isUpdatingProfile ? (
                          <span className="button-loading">
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Saving...
                          </span>
                        ) : (
                          <>
                            <FiCheck className="button-icon" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setEditMode(false)}
                        className="cancel-button"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline-primary" 
                      onClick={() => setEditMode(true)}
                      className="edit-button"
                    >
                      <FiEdit2 className="button-icon" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </Form>
            </div>
          </Tab>

          {/* Password Tab */}
          <Tab eventKey="password" title={<><MdLock /> Password</>} className="password-tab">
            <Form className="password-form">
              <Form.Group className="form-group">
                <Form.Label className="form-label">Current Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="form-input"
                  placeholder="Enter current password"
                />
              </Form.Group>

              <Form.Group className="form-group">
                <Form.Label className="form-label">New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="form-input"
                  placeholder="Enter new password"
                />
              </Form.Group>

              <Form.Group className="form-group">
                <Form.Label className="form-label">Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="form-input"
                  placeholder="Confirm new password"
                />
              </Form.Group>

              {passwordError && (
                <div className="error-message">
                  {passwordError}
                </div>
              )}

              <Button 
                variant="primary" 
                onClick={handlePasswordChange} 
                disabled={isChangingPassword}
                className="change-password-button"
              >
                {isChangingPassword ? (
                  <span className="button-loading">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Changing...
                  </span>
                ) : (
                  <>
                    <MdLock className="button-icon" />
                    Change Password
                  </>
                )}
              </Button>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

export default UserProfileModal;