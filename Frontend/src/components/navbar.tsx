import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Container, Nav, Navbar, Image, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { 
  MdLogout, 
  MdMenu, 
  MdDashboard, 
  MdAssignment, 
  MdInsertDriveFile, 
  MdContactSupport, 
  MdDescription, 
  MdAccountCircle,
  MdEdit
} from "react-icons/md";
import { BsInfoCircle, BsShield } from "react-icons/bs";
import "./navbar.css";
import Logo from "../assets/logo.png";
import ProfileEdit from "./ProfileEdit";

interface Claim {
  _id: string;
  incidentDescription: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface NavbarProps {
  scrollToAPropos?: () => void;
  scrollToClaimForm?: () => void;
  scrollToContactUs?: () => void;
  scrollToServices?: () => void;
  isHomePage?: boolean;
}

const CustomNavbar: React.FC<NavbarProps> = ({
  scrollToAPropos,
  scrollToClaimForm,
  scrollToContactUs,
  scrollToServices,
  isHomePage = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout, user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasNewClaimUpdate, setHasNewClaimUpdate] = useState(false);
  const [showEditIndicator, setShowEditIndicator] = useState(false);

  // Navigation handlers
  const handleAPropos = () => {
    if (isHomePage && scrollToAPropos) {
      scrollToAPropos();
    } else {
      navigate('/#about');
    }
  };

  const handleServices = () => {
    if (isHomePage && scrollToServices) {
      scrollToServices();
    } else {
      navigate('/#services');
    }
  };

  const handleContactUs = () => {
    if (isHomePage && scrollToContactUs) {
      scrollToContactUs();
    } else {
      navigate('/#contact');
    }
  };

  const handleClaimForm = () => {
    if (isHomePage && scrollToClaimForm) {
      scrollToClaimForm();
    } else {
      navigate('/claimform');
    }
  };

  // Check for new claim updates
  useEffect(() => {
    const seenUpdates = localStorage.getItem("seenClaimUpdate");
    if (seenUpdates === "true") {
      setHasNewClaimUpdate(false);
    }
  }, []);

  useEffect(() => {
    const checkClaimUpdates = async () => {
      if (user) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/claims/user/${user._id}`
          );
          const claims: Claim[] = await response.json();
          if (
            Array.isArray(claims) &&
            claims.some((claim) => claim.status !== "pending")
          ) {
            setHasNewClaimUpdate(true);
          }
        } catch (error) {
          console.error("Error fetching claims:", error);
        }
      }
    };

    if (isLoggedIn && user?._id) {
      checkClaimUpdates();
    }
  }, [isLoggedIn, user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavigateToMesDeclarations = () => {
    localStorage.setItem("seenClaimUpdate", "true");
    setHasNewClaimUpdate(false);
    navigate("/mes-declarations");
  };

  const handleNavigateToMesContrats = () => {
    navigate("/mes-contrats");
  };

  // Handle profile modal
  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  return (
    <>
      <Navbar collapseOnSelect expand="lg" className="yomi-navbar">
        <Container>
          <Navbar.Brand href="/" className="yomi-navbar-brand">
            <Image src={Logo} alt="Yomi Assurance" height="50" width="50" className="yomi-logo" />
            <span className="yomi-brand-text">Yomi Assurance</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" className="yomi-navbar-toggler" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto yomi-nav-links">
              <Nav.Link onClick={handleAPropos} className="yomi-nav-link">
                <BsInfoCircle className="yomi-nav-icon" /> À propos
              </Nav.Link>
              <Nav.Link onClick={handleServices} className="yomi-nav-link">
                <BsShield className="yomi-nav-icon" /> Nos Services
              </Nav.Link>

              {isLoggedIn && (
                <Dropdown as={Nav.Item} className="yomi-dropdown">
                  <Dropdown.Toggle as={Nav.Link} className="yomi-dropdown-toggle">
                    <MdMenu className="yomi-nav-icon" /> Plus
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="yomi-dropdown-menu">
                    {location.pathname === "/clienthome" && (
                      <Dropdown.Item onClick={handleClaimForm} className="yomi-dropdown-item">
                        <MdAssignment className="yomi-dropdown-icon" /> Déclarer un sinistre
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item onClick={handleContactUs} className="yomi-dropdown-item">
                      <MdContactSupport className="yomi-dropdown-icon" /> Contactez-nous
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate("/souscription")} className="yomi-dropdown-item">
                      <MdInsertDriveFile className="yomi-dropdown-icon" /> Souscrire à un contrat
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={handleNavigateToMesDeclarations}
                      className="yomi-dropdown-item-with-notification"
                    >
                      <MdDashboard className="yomi-dropdown-icon" /> Mes Déclarations
                      {hasNewClaimUpdate && (
                        <span className="yomi-notification-badge">
                          <span className="yomi-notification-dot"></span>
                        </span>
                      )}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleNavigateToMesContrats} className="yomi-dropdown-item">
                      <MdDescription className="yomi-dropdown-icon" /> Mes Contrats
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
              
              {!isLoggedIn && (
                <>
                  <Nav.Link onClick={handleContactUs} className="yomi-nav-link">
                    <MdContactSupport className="yomi-nav-icon" /> Contactez-nous
                  </Nav.Link>
                  <Nav.Link onClick={() => navigate("/signin")} className="yomi-nav-link">
                    <MdInsertDriveFile className="yomi-nav-icon" /> Souscrire à un contrat
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="yomi-auth-nav">
              {!isLoggedIn ? (
                <>
                  <Nav.Link onClick={() => navigate("/signin")} className="yomi-login-link">
                    Se connecter
                  </Nav.Link>
                  <Nav.Link className="yomi-signup-link">
                    <button className="yomi-signup-button" onClick={() => navigate("/signup")}>
                      S'inscrire
                    </button>
                  </Nav.Link>
                </>
              ) : (
                <div className="yomi-user-profile-container">
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip id="profile-tooltip">Cliquez pour modifier votre profil</Tooltip>}
                    onToggle={(show) => setShowEditIndicator(show)}
                  >
                    <div
                      className="yomi-profile-wrapper"
                      onClick={handleOpenProfileModal}
                    >
                      <div className="yomi-profile-image-container">
                        {user?.profilePic ? (
                          <Image
                            src={user.profilePic}
                            roundedCircle
                            className="yomi-profile-image"
                            alt="Photo de profil"
                          />
                        ) : (
                          <div className="yomi-profile-initials">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                          </div>
                        )}
                        <div className="yomi-profile-edit-overlay">
                          <MdEdit className="yomi-profile-edit-icon" />
                        </div>
                      </div>
                      
                      <span className="yomi-user-name">
                        {user?.name} {user?.lastname}
                      </span>
                    </div>
                  </OverlayTrigger>

                  <button 
                    className="yomi-logout-button" 
                    onClick={handleLogout}
                    title="Se déconnecter"
                  >
                    <MdLogout className="yomi-logout-icon" />
                    <span className="yomi-logout-text">Déconnexion</span>
                  </button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Modal for Profile Edit */}
      {user && (
        <ProfileEdit
          userId={user._id}
          show={showProfileModal}
          onHide={handleCloseProfileModal}
        />
      )}
    </>
  );
};

export default CustomNavbar;