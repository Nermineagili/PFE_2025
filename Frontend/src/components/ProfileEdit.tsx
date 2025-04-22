import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Image, Alert, Tabs, Tab } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import "./ProfileEdit.css"; // Import the CSS file

interface ProfileEditProps {
  userId: string;
  show: boolean;
  onHide: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ userId, show, onHide }) => {
  const { user, updateUserContext } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.profilePic || null);
  const [uploading, setUploading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Feedback states
  const [profileUpdateMessage, setProfileUpdateMessage] = useState({ type: "", message: "" });
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState({ type: "", message: "" });
  const [imageUpdateMessage, setImageUpdateMessage] = useState({ type: "", message: "" });

  // Fetch user data on component mount or when userId changes
  useEffect(() => {
    if (userId && show) {
      fetchUserData();
    }
  }, [userId, show]);

  // Reset form when modal is opened
  useEffect(() => {
    if (show) {
      // Reset feedback messages
      setProfileUpdateMessage({ type: "", message: "" });
      setPasswordUpdateMessage({ type: "", message: "" });
      setImageUpdateMessage({ type: "", message: "" });
      
      // Reset password form
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [show]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      const userData = await response.json();
      if (userData.success && userData.data) {
        setFormData({
          name: userData.data.name || "",
          lastname: userData.data.lastname || "",
          email: userData.data.email || "",
          phone: userData.data.phone || "",
          address: userData.data.address || "",
        });
        
        if (userData.data.profilePic) {
          setImagePreview(userData.data.profilePic);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProfileUpdateMessage({ type: "success", message: "Profile updated successfully!" });
        
        // Update user context if available
        if (updateUserContext) {
          updateUserContext(result.data);
        }
      } else {
        setProfileUpdateMessage({ type: "danger", message: result.message || "Update failed. Please try again." });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileUpdateMessage({ type: "danger", message: "An error occurred. Please try again." });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordUpdateMessage({ type: "danger", message: "New passwords don't match." });
      return;
    }
    
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/user/change-password/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setPasswordUpdateMessage({ type: "success", message: "Password updated successfully!" });
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordUpdateMessage({ type: "danger", message: result.error || "Password update failed." });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordUpdateMessage({ type: "danger", message: "An error occurred. Please try again." });
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setImageUpdateMessage({ type: "warning", message: "Please select an image first." });
      return;
    }
    
    setUploading(true);
    
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("userId", userId);
      
      const response = await fetch("http://localhost:5000/api/user/upload-profile-pic", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImageUpdateMessage({ type: "success", message: "Profile picture updated successfully!" });
        
        // Update user context if available
        if (updateUserContext && result.data.profilePic) {
          updateUserContext({
            ...user,
            profilePic: result.data.profilePic,
          });
        }
      } else {
        setImageUpdateMessage({ type: "danger", message: result.message || "Upload failed." });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setImageUpdateMessage({ type: "danger", message: "An error occurred during upload." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveKey="profileInfo" id="profile-edit-tabs" className="mb-3">
          <Tab eventKey="profileInfo" title="Profile Information">
            {profileUpdateMessage.message && (
              <Alert variant={profileUpdateMessage.type}>
                {profileUpdateMessage.message}
              </Alert>
            )}
            
            <Form onSubmit={handleProfileUpdate}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
              
              <Button variant="primary" type="submit" className="w-100">
                Update Profile
              </Button>
            </Form>
          </Tab>
          
          <Tab eventKey="profilePicture" title="Profile Picture">
            {imageUpdateMessage.message && (
              <Alert variant={imageUpdateMessage.type}>
                {imageUpdateMessage.message}
              </Alert>
            )}
            
            <div className="text-center mb-4">
              {imagePreview ? (
                <Image 
                  src={imagePreview} 
                  roundedCircle 
                  className="profile-preview"
                />
              ) : (
                <div className="profile-preview-placeholder">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>
            
            <Form onSubmit={handleImageUpload}>
              <Form.Group className="mb-3">
                <Form.Label>Upload New Profile Picture</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Form.Group>
              
              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={!selectedImage || uploading}
              >
                {uploading ? "Uploading..." : "Update Profile Picture"}
              </Button>
            </Form>
          </Tab>
          
          <Tab eventKey="changePassword" title="Change Password">
            {passwordUpdateMessage.message && (
              <Alert variant={passwordUpdateMessage.type}>
                {passwordUpdateMessage.message}
              </Alert>
            )}
            
            <Form onSubmit={handlePasswordUpdate}>
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
                {passwordData.newPassword !== passwordData.confirmPassword && 
                  passwordData.confirmPassword && (
                    <Form.Text className="text-danger">
                      Passwords do not match
                    </Form.Text>
                  )
                }
              </Form.Group>
              
              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={
                  !passwordData.oldPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
              >
                Change Password
              </Button>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileEdit;