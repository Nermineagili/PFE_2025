import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Image, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { MdEdit } from 'react-icons/md';
import axios from 'axios';
import ProfileEdit from './ProfileEdit';
import './AdsupNavbar.css';
import Logo from '../assets/logo.png';

const AdsupNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditIndicator, setShowEditIndicator] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    console.log('[AdsupNavbar] User:', user);
    const fetchUnreadCount = async () => {
      if (!user) {
        console.warn('[AdsupNavbar] No user, skipping fetch');
        return;
      }
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('[AdsupNavbar] No auth token found');
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[AdsupNavbar] Unread count:', response.data.count);
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('[AdsupNavbar] Error fetching unread notifications:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleDashboardClick = () => {
    console.log('[AdsupNavbar] Navigating to dashboard');
    navigate('/');
  };

  const handleNotificationsClick = () => {
    console.log('[AdsupNavbar] Notification clicked, user role:', user?.role);
    try {
      if (user?.role === 'superviseur') {
        navigate('/supervisor-messages');
      } else {
        console.warn('[AdsupNavbar] Invalid role for notifications or admin role:', user?.role);
      }
    } catch (error) {
      console.error('[AdsupNavbar] Navigation error:', error);
    }
  };

  const handleProfileClick = () => {
    console.log('[AdsupNavbar] Opening profile modal');
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    console.log('[AdsupNavbar] Closing profile modal');
    setShowProfileModal(false);
  };

  const handleLogout = () => {
    console.log('[AdsupNavbar] Logging out');
    logout();
    navigate('/');
  };

  console.log('[AdsupNavbar] Rendering, user role:', user?.role, 'unreadCount:', unreadCount);

  return (
    <>
      <Navbar className="adsup-navbar" expand="lg" fixed="top">
        <Container fluid>
          <Navbar.Brand onClick={handleDashboardClick} className="adsup-brand" style={{ cursor: 'pointer' }}>
            <img
              src={Logo}
              width="60"
              height="60"
              className="d-inline-block align-top logo-image"
              alt="YOMI Logo"
            />
            <span className="ms-2">YOMI Insurance</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              {user?.role === 'superviseur' && (
                <Nav.Link onClick={handleNotificationsClick} className="adsup-nav-link">
                  <FontAwesomeIcon icon={faBell} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </Nav.Link>
              )}

              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip id="profile-tooltip">Modifier le profil</Tooltip>}
                onToggle={(show) => setShowEditIndicator(show)}
              >
                <Nav.Link onClick={handleProfileClick} className="adsup-nav-link user-info">
                  <div className="adsup-profile-wrapper">
                    <div className="adsup-profile-image-container">
                      {user?.profilePic ? (
                        <Image
                          src={user.profilePic}
                          roundedCircle
                          className="adsup-profile-image"
                          alt="Photo de profil"
                        />
                      ) : (
                        <div className="adsup-profile-initials">
                          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <div className="adsup-profile-edit-overlay">
                        <MdEdit className="adsup-profile-edit-icon" />
                      </div>
                    </div>
                    <span className="ms-2 d-none d-md-inline">
                      {user?.name || (user?.role === 'admin' ? 'Admin' : user?.role === 'superviseur' ? 'Superviseur' : 'User')}
                    </span>
                  </div>
                </Nav.Link>
              </OverlayTrigger>

              <Nav.Link onClick={handleLogout} className="adsup-nav-link logout-btn">
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span className="ms-2 d-none d-md-inline">Déconnexion</span>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

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

export default AdsupNavbar;