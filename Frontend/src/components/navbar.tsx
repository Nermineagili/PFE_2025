import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Container, Nav, Navbar, Image, Dropdown } from "react-bootstrap";
import { MdLogout, MdMenu, MdDashboard, MdAssignment, MdInsertDriveFile, MdContactSupport } from "react-icons/md";
import { BsInfoCircle, BsShield } from "react-icons/bs";
import UserProfileModal from "./UserProfileModal";
import "./navbar.css";
import Logo from "../assets/logo.png";

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
  const { isLoggedIn, logout, user, login } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasNewClaimUpdate, setHasNewClaimUpdate] = useState(false);

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

  // Rest of your existing navbar code...
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

  const handleImageUpload = (imageUrl: string) => {
    if (user) {
      const updatedUser = { ...user, profilePic: imageUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      login(localStorage.getItem("authToken") || "", updatedUser);
    }
  };

  const handleNavigateToMesDeclarations = () => {
    localStorage.setItem("seenClaimUpdate", "true");
    setHasNewClaimUpdate(false);
    navigate("/mes-declarations");
  };

  return (
    <>
      <Navbar collapseOnSelect expand="lg" className="custom-navbar">
        <Container>
          <Navbar.Brand href="/">
            <Image src={Logo} alt="Logo" height="50" width="50" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={handleAPropos}><BsInfoCircle className="me-1" /> À propos</Nav.Link>
              <Nav.Link onClick={handleServices}><BsShield className="me-1" /> Nos Services</Nav.Link>
              
              {isLoggedIn && (
                <Dropdown as={Nav.Item}>
                  <Dropdown.Toggle as={Nav.Link} className="nav-dropdown-toggle">
                    <MdMenu className="me-1" /> Plus
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="nav-dropdown-menu">
                    {location.pathname === "/clienthome" && (
                      <Dropdown.Item onClick={handleClaimForm}>
                        <MdAssignment className="me-2" /> Déclaration de sinistre
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item onClick={handleContactUs}>
                      <MdContactSupport className="me-2" /> Contactez-nous
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate("/souscription")}>
                      <MdInsertDriveFile className="me-2" /> Souscrire à un contrat
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={handleNavigateToMesDeclarations}
                      className="dropdown-item-with-notification"
                    >
                      <MdDashboard className="me-2" /> Mes Déclarations
                      {hasNewClaimUpdate && (
                        <span className="dropdown-notification-badge">
                          <span className="notification-dot"></span>
                        </span>
                      )}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
              
              {!isLoggedIn && (
                <>
                  <Nav.Link onClick={handleContactUs}>Contactez-nous</Nav.Link>
                  <Nav.Link onClick={() => navigate("/signin")}>
                    Souscrire à un contrat
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="d-flex align-items-center">
              {!isLoggedIn ? (
                <>
                  <Nav.Link onClick={() => navigate("/signin")}>Se connecter</Nav.Link>
                  <Nav.Link>
                    <button className="custom-button" onClick={() => navigate("/signup")}>
                      S'inscrire
                    </button>
                  </Nav.Link>
                </>
              ) : (
                <Nav.Item className="d-flex align-items-center">
                  <div
                    className="profile-container"
                    onClick={() => setShowProfileModal(true)}
                    style={{ cursor: "pointer" }}
                  >
                    {user?.profilePic ? (
                      <Image
                        src={user.profilePic}
                        roundedCircle
                        width="40"
                        height="40"
                        className="profile-image"
                      />
                    ) : (
                      <div className="profile-initials">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                  </div>

                  <span className="navbar-user-name" style={{ margin: "0 8px" }}>
                    {user?.name} {user?.lastname}
                  </span>

                  <MdLogout
                    size={24}
                    className="nav-icon"
                    onClick={handleLogout}
                    title="Se déconnecter"
                    style={{ cursor: "pointer", marginLeft: "4px" }}
                  />
                </Nav.Item>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <UserProfileModal
        key={showProfileModal ? "open" : "closed"}
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
      />
    </>
  );
};

export default CustomNavbar;