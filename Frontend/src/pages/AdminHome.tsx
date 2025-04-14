import React, { useRef, useState } from "react";
import { Container } from "react-bootstrap";
import AdminSidebarProps from "../components/AdminSidebar";
import Dashboard from "./Dashboard";
import ManageUsers from "../components/ManageUsers";
import Settings from "../components/Settings";
import ManageClaims from "../components/ManageClaims";
import Postlogin from "../components/ChatBot/Postlogin";
import AdsupNavbar from "../components/AdsupNavbar";
import "./AdminHome.css"; // Make sure to include your CSS

const AdminHome: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const manageUsersRef = useRef<HTMLDivElement>(null);
  const manageDashboardRef = useRef<HTMLDivElement>(null);
  const manageSettingsRef = useRef<HTMLDivElement>(null);
  const manageClaimsRef = useRef<HTMLDivElement>(null);

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
        onManageSettingsClick={scrollToSettings} 
        onManageClaimsClick={scrollToClaims} 
        role="admin" 
        onSidebarToggle={handleSidebarToggle}
      />

      {/* Main Content Area - This should adjust based on sidebar state */}
      <div className={`admin-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Container fluid className="p-4">
          <div ref={manageDashboardRef}>
            <Dashboard />
          </div>
          
          <div ref={manageUsersRef}>
            <ManageUsers />
          </div>
          
          {/* <div ref={manageClaimsRef}>
            <ManageClaims />
          </div> */}
          
          <div ref={manageSettingsRef}>
            <Settings />
          </div>
        </Container>
      </div>
      
      {/* Chatbot component */}
      <Postlogin userType={"client"} />
    </div>
  );
};

export default AdminHome;