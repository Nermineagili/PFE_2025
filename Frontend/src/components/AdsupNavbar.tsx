import React from 'react';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBell, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './AdsupNavbar.css'; // Import the CSS file
// Import the logo at the top of the file
import Logo from "../assets/logo.png"; // Make sure the path is correct

const AdsupNavbar: React.FC = () => {
  const { user, logout } = useAuth(); // Assuming useAuth provides user and logout function
  
  return (
    <Navbar className="adsup-navbar" expand="lg" fixed="top">
      <Container fluid>
        <Navbar.Brand href="#dashboard" className="adsup-brand">
          <img
            src={Logo} // Use the imported logo
            width="40" // Increased from 30 to 40
            height="40" // Increased from 30 to 40
            className="d-inline-block align-top logo-image" // Added logo-image class
            alt="YOMI Logo"
          />
          <span className="ms-2">YOMI Insurance</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav>
            <Nav.Link href="#notifications" className="adsup-nav-link">
              <FontAwesomeIcon icon={faBell} />
              <span className="notification-badge">3</span>
            </Nav.Link>
            
            <Nav.Link href="#profile" className="adsup-nav-link user-info">
              <FontAwesomeIcon icon={faUser} className="user-icon" />
              <span className="ms-2 d-none d-md-inline">
                {user?.role === "admin" ? "Admin" : user?.role === "superviseur" ? "Superviseur" : "User"}
              </span>
            </Nav.Link>
            
            <Nav.Link onClick={logout} className="adsup-nav-link logout-btn">
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span className="ms-2 d-none d-md-inline"></span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdsupNavbar;