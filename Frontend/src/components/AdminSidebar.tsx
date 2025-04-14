import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faUsers,
  faCog,
  faSignOutAlt,
  faBars,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@themesberg/react-bootstrap";
import { useAuth } from "../context/AuthContext";
import "./AdminSidebar.css";

interface AdminSidebarProps {
  role: "admin" | "supervisor"; // Pass the role
  onManageUsersClick?: () => void;
  onManageSettingsClick?: () => void;
  onManageDashboardClick?: () => void;
  onManageClaimsClick?: () => void;
  onSidebarToggle?: (collapsed: boolean) => void; // New callback prop
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  role,
  onManageUsersClick,
  onManageSettingsClick,
  onManageDashboardClick,
  onManageClaimsClick,
  onSidebarToggle,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Notify parent component when sidebar state changes
    if (onSidebarToggle) {
      onSidebarToggle(collapsed);
    }
  }, [collapsed, onSidebarToggle]);

  const handleLogout = (event: React.MouseEvent) => {
    event.preventDefault();
    logout();
    navigate("/");
  };

  const handleDashboardClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageDashboardClick) onManageDashboardClick();
  };

  const handleManageUsersClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageUsersClick) onManageUsersClick();
  };

  const handleSettingsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageSettingsClick) onManageSettingsClick();
  };

  const handleManageClaimsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageClaimsClick) onManageClaimsClick();
  };

  return (
    <div
      className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}
      style={{ overflowY: "auto", maxHeight: "100vh" }}
    >
      <Button
        variant="link"
        className="admin-sidebar-toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        <FontAwesomeIcon icon={faBars} />
      </Button>

      <nav className="admin-sidebar-nav">
        {/* Dashboard */}
        <a href="#!" className="admin-nav-item" onClick={handleDashboardClick}>
          <FontAwesomeIcon icon={faTachometerAlt} className="admin-nav-icon" />
          <span>Dashboard</span>
        </a>

        {/* Admin-only: Manage Users */}
        {role === "admin" && (
          <a href="#!" className="admin-nav-item" onClick={handleManageUsersClick}>
            <FontAwesomeIcon icon={faUsers} className="admin-nav-icon" />
            <span>Manage Users</span>
          </a>
        )}

        {/* Supervisor-only: Manage Claims */}
        {role === "supervisor" && (
          <a href="#!" className="admin-nav-item" onClick={handleManageClaimsClick}>
            <FontAwesomeIcon icon={faClipboardList} className="admin-nav-icon" />
            <span>Manage Claims</span>
          </a>
        )}

        {/* Common: Settings */}
        <a href="#!" className="admin-nav-item" onClick={handleSettingsClick}>
          <FontAwesomeIcon icon={faCog} className="admin-nav-icon" />
          <span>Settings</span>
        </a>

        {/* Logout button moved to sidebar since it's already here */}
        <NavLink
          to="/logout"
          className="admin-nav-item admin-log-out"
          onClick={handleLogout}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="admin-nav-icon" />
          <span>Logout</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;