import React, { useRef, useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import AdminSidebarProps from "../components/AdminSidebar";
import Dashboard from "./Dashboard";
import ManageUsers from "../components/ManageUsers";
import Settings from "../components/Settings";
import ManageClaims from "../components/ManageClaims";
import AdsupNavbar from "../components/AdsupNavbar";
import ResetPasswordApproval from "./ResetPasswordApproval";
import { useLocation } from "react-router-dom";
import "./AdminHome.css";
import TaskManager from "../components/TaskManager";

// Function to extract token and userId from URL
const extractResetParams = () => {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split('/');
  
  if (pathParts.includes('approve-reset')) {
    const token = pathParts[pathParts.indexOf('approve-reset') + 1];
    const userId = pathParts[pathParts.indexOf('approve-reset') + 2];
    
    // Return undefined if either value is falsy
    return token && userId ? { token, userId } : { token: undefined, userId: undefined };
  }
  
  return { token: undefined, userId: undefined };
};

const AdminHome: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const manageUsersRef = useRef<HTMLDivElement>(null);
  const manageDashboardRef = useRef<HTMLDivElement>(null);
  const manageSettingsRef = useRef<HTMLDivElement>(null);
  const manageClaimsRef = useRef<HTMLDivElement>(null);
  const resetPasswordRef = useRef<HTMLDivElement>(null);
  const manageTasksRef = useRef<HTMLDivElement>(null);
  
  // For reset password approval
  const [showResetSection, setShowResetSection] = useState<boolean>(false);
  const location = useLocation();
  const { token: resetToken, userId: resetUserId } = extractResetParams();

  // If reset token is in the URL, automatically show reset approval section and scroll to it
  useEffect(() => {
    if (resetToken && resetUserId) {
      setShowResetSection(true);
      // After state update, scroll to the reset section
      setTimeout(() => {
        if (resetPasswordRef.current) {
          resetPasswordRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    }
  }, [resetToken, resetUserId]);

  const scrollToManageUsers = () => {
    if (manageUsersRef.current) {
      manageUsersRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const scrollToDashboard = () => {
    if (manageDashboardRef.current) {
      manageDashboardRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const scrollToSettings = () => {
    if (manageSettingsRef.current) {
      manageSettingsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const scrollToClaims = () => {
    if (manageClaimsRef.current) {
      manageClaimsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  const scrollToTasks = () => {
    if (manageTasksRef.current) {
      manageTasksRef.current.scrollIntoView({ behavior: "smooth"});
    }
  };

  const scrollToResetPassword = () => {
    setShowResetSection(true);
    setTimeout(() => {
      if (resetPasswordRef.current) {
        resetPasswordRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Handle sidebar collapse state change
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="admin-layout">
      {/* Navbar at the top */}
      <AdsupNavbar />
      
      {/* Sidebar */}
      <AdminSidebarProps 
        onManageUsersClick={scrollToManageUsers} 
        onManageDashboardClick={scrollToDashboard} 
        onManageTasksClick={scrollToTasks}
        onManageSettingsClick={scrollToSettings} 
        onManageClaimsClick={scrollToClaims}
        onResetPasswordClick={scrollToResetPassword}
        role="admin" 
        onSidebarToggle={handleSidebarToggle}
      />

      {/* Main Content Area - This should adjust based on sidebar state */}
      <div className={`admin-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Container fluid className="p-4">
          <div ref={manageDashboardRef}>
            <Dashboard />
          </div>
          <div ref={manageTasksRef}>
            <TaskManager/>
          </div>
          {/* <div ref={resetPasswordRef}>
          {showResetSection && (
  <ResetPasswordApproval 
    tokenFromURL={resetToken}  // This will be undefined if not in URL
    userIdFromURL={resetUserId} // This will be undefined if not in URL
  />
)}
</div> */}
          
          <div ref={manageUsersRef}>
            <ManageUsers />
          </div>
          
          {/* <div ref={manageClaimsRef}>
            <ManageClaims />
          </div> */}
          
          {/* <div ref={manageSettingsRef}>
            <Settings />
          </div> */}
        </Container>
      </div>
      
      {/* Chatbot component */}
    </div>
  );
};

export default AdminHome;