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
  faEnvelope,
  faFileContract ,
  faKey,
  faTasks, 

} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@themesberg/react-bootstrap";
import { useAuth } from "../context/AuthContext";
import "./AdminSidebar.css";

interface AdminSidebarProps {
  role: "admin" | "supervisor";
  onManageUsersClick?: () => void;
  onManageSettingsClick?: () => void;
  onManageDashboardClick?: () => void;
  onManageClaimsClick?: () => void;
  onSidebarToggle?: (collapsed: boolean) => void;
  onMessagesClick?: () => void;
  onManageContractsClick?: () => void; // Fixed typo in property name
  onResetPasswordClick?:()=>void
  onManageTasksClick?: ()=> void ;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  role,
  onManageUsersClick,
  onManageSettingsClick,
  onManageDashboardClick,
  onManageClaimsClick,
  onSidebarToggle,
  onMessagesClick,
  onManageContractsClick,
  onResetPasswordClick,
  onManageTasksClick
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
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

  const handleMessagesClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onMessagesClick) {
      onMessagesClick();
    } else {
      navigate("/supervisor-messages");
    }
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
  
  // Fixed function name to match property name
  const handleManageContractsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageContractsClick) 
      onManageContractsClick();
  
  };
  const handleResetPasswordClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onResetPasswordClick) 
      onResetPasswordClick();
  
  };
  const handleTaskManagerClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onManageTasksClick)
      onManageTasksClick();
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
            <span>Tableau de bord</span>        
        </a>
        {/*tasks section*/}
        <a href="#!" className="admin-nav-item" onClick={handleTaskManagerClick}>
          <FontAwesomeIcon icon={faTasks} className="admin-nav-icon" />
            <span>Tâches à faire</span>        
        </a>

        {/* Admin-only: Manage Users */}
        {role === "admin" && (
          <a href="#!" className="admin-nav-item" onClick={handleManageUsersClick}>
            <FontAwesomeIcon icon={faUsers} className="admin-nav-icon" />
            <span>Gérer les utilisateurs</span>
          </a>
        )}
        {/* {role === "admin" && (
          <a href="#!" className="admin-nav-item" onClick={handleResetPasswordClick}>
            <FontAwesomeIcon icon={faKey} className="admin-nav-icon" />
            <span>mot de passe</span>
          </a>
        )} */}
        
        {/* Supervisor-only: Users with Contracts */}
        {role === "supervisor" && (
          <a href="#!" className="admin-nav-item" onClick={handleManageContractsClick}>
            <FontAwesomeIcon icon={faFileContract} className="admin-nav-icon" />
            <span>Contrats des utilisateurs</span>
          </a>
        )}

        {/* Supervisor-only: Manage Claims */}
        {role === "supervisor" && (
          <a href="#!" className="admin-nav-item" onClick={handleManageClaimsClick}>
            <FontAwesomeIcon icon={faClipboardList} className="admin-nav-icon" />
            <span>Gérer les réclamations</span>
          </a>
        )}

        {/* Supervisor-only: Messages */}
        {role === "supervisor" && (
          <a href="#!" className="admin-nav-item" onClick={handleMessagesClick}>
            <FontAwesomeIcon icon={faEnvelope} className="admin-nav-icon" />
            <span>Messages</span>
          </a>
        )}

        {/* Common: Settings */}
        {/* <a href="#!" className="admin-nav-item" onClick={handleSettingsClick}>
          <FontAwesomeIcon icon={faCog} className="admin-nav-icon" />
          <span>Paramètres</span>
        </a> */}

        {/* Logout */}
        <NavLink
          to="/logout"
          className="admin-nav-item admin-log-out"
          onClick={handleLogout}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="admin-nav-icon" />
          <span>Déconnexion</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;