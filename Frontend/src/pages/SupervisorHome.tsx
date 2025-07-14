import React, { useRef, useState } from "react";
import { Container } from "react-bootstrap";
import AdminSidebar from "../components/AdminSidebar";
import Dashboard from "./Dashboard";
import ManageClaims from "../components/ManageClaims";
import Settings from "../components/Settings";
import AdsupNavbar from "../components/AdsupNavbar";
import "./SupervisorHome.css";
import UsersWithContracts from "../components/UsersWithContracts";
import TaskManager from "../components/TaskManager"; 

const SupervisorHome: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const manageDashboardRef = useRef<HTMLDivElement>(null);
  const manageClaimsRef = useRef<HTMLDivElement>(null);
  const manageSettingsRef = useRef<HTMLDivElement>(null);
  const manageContractsRef = useRef<HTMLDivElement>(null);
  const manageTasksRef = useRef<HTMLDivElement>(null); 

  const scrollToDashboard = () => {
    manageDashboardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToClaims = () => {
    manageClaimsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSettings = () => {
    manageSettingsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContracts = () => {
    manageContractsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTasks = () => {
    manageTasksRef.current?.scrollIntoView({ behavior: "smooth" }); 
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
        onManageContractsClick={scrollToContracts}
        onManageTasksClick={scrollToTasks} 
      />

      {/* Main Content Area - This adjusts based on sidebar state */}
      <div className={`supervisor-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Container fluid className="p-4">
          <div ref={manageDashboardRef}>
            <Dashboard />
          </div>
          <div ref={manageTasksRef}>
            <TaskManager /> 
          </div>
          <div ref={manageContractsRef}>
            <UsersWithContracts />
          </div>
          <div ref={manageClaimsRef}>
            <ManageClaims />
          </div>
          {/* <div ref={manageSettingsRef}>
            <Settings />
          </div> */}

        </Container>
      </div>
    </div>
  );
};

export default SupervisorHome;