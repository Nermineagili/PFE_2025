import React, { useRef, useState } from "react";
import { Container } from "react-bootstrap";
import AdminSidebar from "../components/AdminSidebar";
import Dashboard from "./Dashboard";
import ManageClaims from "../components/ManageClaims";
import Settings from "../components/Settings";
import Postlogin from "../components/ChatBot/Postlogin";
import AdsupNavbar from "../components/AdsupNavbar";
import "./SupervisorHome.css"; // Make sure to create this CSS file

const SupervisorHome: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const manageDashboardRef = useRef<HTMLDivElement>(null);
  const manageClaimsRef = useRef<HTMLDivElement>(null);
  const manageSettingsRef = useRef<HTMLDivElement>(null);

  const scrollToDashboard = () => {
    manageDashboardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToClaims = () => {
    manageClaimsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSettings = () => {
    manageSettingsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sidebar collapse state change
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="supervisor-layout">
      {/* AdsUp Navbar */}
      <AdsupNavbar />

      {/* Sidebar */}
      <AdminSidebar
        role="supervisor"
        onManageDashboardClick={scrollToDashboard}
        onManageClaimsClick={scrollToClaims}
        onManageSettingsClick={scrollToSettings}
        onSidebarToggle={handleSidebarToggle}
      />

      {/* Main Content Area - This adjusts based on sidebar state */}
      <div className={`supervisor-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Container fluid className="p-4">
          <div ref={manageDashboardRef}>
            <Dashboard />
          </div>
          
          <div ref={manageClaimsRef}>
            <ManageClaims />
          </div>
          
          <div ref={manageSettingsRef}>
            <Settings />
          </div>
        </Container>
      </div>

      {/* Chatbot component */}
      <Postlogin userType="client" />
    </div>
  );
};

export default SupervisorHome;