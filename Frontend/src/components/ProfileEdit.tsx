import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Image, Alert, Tabs, Tab } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import "./ProfileEdit.css"; // Import du fichier CSS

interface ProfileEditProps {
  userId: string;
  show: boolean;
  onHide: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ userId, show, onHide }) => {
  const { user, updateUserContext } = useAuth();

  // États du formulaire
  const [formData, setFormData] = useState({
    name: user?.name || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  // États pour l'upload d'image
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.profilePic || null);
  const [uploading, setUploading] = useState(false);

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // États pour les messages de feedback
  const [profileUpdateMessage, setProfileUpdateMessage] = useState({ type: "", message: "" });
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState({ type: "", message: "" });
  const [imageUpdateMessage, setImageUpdateMessage] = useState({ type: "", message: "" });

  // Récupération des données utilisateur
  useEffect(() => {
    if (userId && show) {
      fetchUserData();
    }
  }, [userId, show]);

  // Réinitialisation du formulaire
  useEffect(() => {
    if (show) {
      setProfileUpdateMessage({ type: "", message: "" });
      setPasswordUpdateMessage({ type: "", message: "" });
      setImageUpdateMessage({ type: "", message: "" });
      
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
        throw new Error("Échec de la récupération des données utilisateur");
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
      console.error("Erreur lors de la récupération des données utilisateur:", error);
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
        setProfileUpdateMessage({ type: "success", message: "Profil mis à jour avec succès !" });
        
        if (updateUserContext) {
          updateUserContext(result.data);
        }
      } else {
        setProfileUpdateMessage({ type: "danger", message: result.message || "Échec de la mise à jour. Veuillez réessayer." });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      setProfileUpdateMessage({ type: "danger", message: "Une erreur est survenue. Veuillez réessayer." });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordUpdateMessage({ type: "danger", message: "Les nouveaux mots de passe ne correspondent pas." });
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
        setPasswordUpdateMessage({ type: "success", message: "Mot de passe mis à jour avec succès !" });
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordUpdateMessage({ type: "danger", message: result.error || "Échec de la mise à jour du mot de passe." });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      setPasswordUpdateMessage({ type: "danger", message: "Une erreur est survenue. Veuillez réessayer." });
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setImageUpdateMessage({ type: "warning", message: "Veuillez d'abord sélectionner une image." });
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
        setImageUpdateMessage({ type: "success", message: "Photo de profil mise à jour avec succès !" });
        
        if (updateUserContext && result.data.profilePic) {
          updateUserContext({
            ...user,
            profilePic: result.data.profilePic,
          });
        }
      } else {
        setImageUpdateMessage({ type: "danger", message: result.message || "Échec de l'upload." });
      }
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image:", error);
      setImageUpdateMessage({ type: "danger", message: "Une erreur est survenue pendant l'upload." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Modifier le profil</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveKey="profileInfo" id="profile-edit-tabs" className="mb-3">
          <Tab eventKey="profileInfo" title="Informations du profil">
            {profileUpdateMessage.message && (
              <Alert variant={profileUpdateMessage.type}>
                {profileUpdateMessage.message}
              </Alert>
            )}
            
            <Form onSubmit={handleProfileUpdate}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
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
                    <Form.Label>Nom</Form.Label>
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
                <Form.Label>Adresse email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Adresse</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
              
              <Button variant="primary" type="submit" className="w-100">
                Mettre à jour le profil
              </Button>
            </Form>
          </Tab>
          
          <Tab eventKey="profilePicture" title="Photo de profil">
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
                <Form.Label>Changer la photo de profil</Form.Label>
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
                {uploading ? "Envoi en cours..." : "Mettre à jour la photo"}
              </Button>
            </Form>
          </Tab>
          
          <Tab eventKey="changePassword" title="Changer le mot de passe">
            {passwordUpdateMessage.message && (
              <Alert variant={passwordUpdateMessage.type}>
                {passwordUpdateMessage.message}
              </Alert>
            )}
            
            <Form onSubmit={handlePasswordUpdate}>
              <Form.Group className="mb-3">
                <Form.Label>Mot de passe actuel</Form.Label>
                <Form.Control
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Nouveau mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
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
                      Les mots de passe ne correspondent pas
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
                Changer le mot de passe
              </Button>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileEdit;