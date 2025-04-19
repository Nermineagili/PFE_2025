import React from 'react';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBell, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './AdsupNavbar.css'; 
import Logo from "../assets/logo.png";

const AdsupNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleDashboardClick = () => {
    navigate('/');
  };
  
  const handleNotificationsClick = () => {
    navigate('/supervisor-messages');
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <Navbar className="adsup-navbar" expand="lg" fixed="top">
      <Container fluid>
        <Navbar.Brand onClick={handleDashboardClick} className="adsup-brand" style={{ cursor: 'pointer' }}>
          <img
            src={Logo}
            width="40"
            height="40"
            className="d-inline-block align-top logo-image"
            alt="YOMI Logo"
          />
          <span className="ms-2">YOMI Insurance</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav>
            <Nav.Link onClick={handleNotificationsClick} className="adsup-nav-link">
              <FontAwesomeIcon icon={faBell} />
              <span className="notification-badge">3</span>
            </Nav.Link>
            
            <Nav.Link onClick={handleProfileClick} className="adsup-nav-link user-info">
              <FontAwesomeIcon icon={faUser} className="user-icon" />
              <span className="ms-2 d-none d-md-inline">
                {user?.role === "admin" ? "Admin" : user?.role === "superviseur" ? "Superviseur" : "User"}
              </span>
            </Nav.Link>
            
            <Nav.Link onClick={handleLogout} className="adsup-nav-link logout-btn">
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