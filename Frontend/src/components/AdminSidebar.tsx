import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTachometerAlt, faUsers, faCog, faSignOutAlt, faBars, faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@themesberg/react-bootstrap";
import { useAuth } from "../context/AuthContext";
import "./AdminSidebar.css";

interface AdminSidebarProps {
  onManageUsersClick?: () => void;
  onManageSettingsClick?: () => void;
  onManageDashboardClick?: () => void;
  onManageClaimsClick?: () => void; // Added prop for Manage Claims
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onManageUsersClick,
  onManageSettingsClick,
  onManageDashboardClick,
  onManageClaimsClick, // Added to function parameters
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = (event: React.MouseEvent) => {
    event.preventDefault();
    logout();
    navigate("/");
  };

  const handleManageUsersClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageUsersClick) {
      onManageUsersClick();
    }
  };

  const handleSettingsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageSettingsClick) {
      onManageSettingsClick();
    }
  };

  const handleDashboardClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageDashboardClick) {
      onManageDashboardClick();
    }
  };

  const handleManageClaimsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageClaimsClick) {
      onManageClaimsClick();
    }
  };

  return (
    <div className={`admin-sidebar ${collapsed ? "collapsed" : ""}`} style={{ overflowY: "auto", maxHeight: "100vh" }}>
      <Button
        variant="link"
        className="admin-sidebar-toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        <FontAwesomeIcon icon={faBars} />
      </Button>

      <nav className="admin-sidebar-nav">
        <a href="#!" className="admin-nav-item" onClick={handleDashboardClick}>
          <FontAwesomeIcon icon={faTachometerAlt} className="admin-nav-icon" />
          <span>Dashboard</span>
        </a>

        <a href="#!" className="admin-nav-item" onClick={handleManageUsersClick}>
          <FontAwesomeIcon icon={faUsers} className="admin-nav-icon" />
          <span>Manage Users</span>
        </a>

        <a href="#!" className="admin-nav-item" onClick={handleManageClaimsClick}>
          <FontAwesomeIcon icon={faClipboardList} className="admin-nav-icon" />
          <span>Manage Claims</span>
        </a>

        <a href="#!" className="admin-nav-item" onClick={handleSettingsClick}>
          <FontAwesomeIcon icon={faCog} className="admin-nav-icon" />
          <span>Settings</span>
        </a>

        <NavLink to="/logout" className="admin-nav-item admin-log-out" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} className="admin-nav-icon" />
          <span>Logout</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;
