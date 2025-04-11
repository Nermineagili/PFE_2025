import React, { useRef } from "react";
import { Container } from "react-bootstrap";
import AdminSidebar from "../components/AdminSidebar";
import Dashboard from "./Dashboard";
import ManageUsers from "../components/ManageUsers";
import Settings from "../components/Settings";
import ManageClaims from "../components/ManageClaims"
import Postlogin from "../components/ChatBot/Postlogin";

const AdminHome: React.FC = () => {
  const manageUsersRef = useRef<HTMLDivElement>(null); // Reference to Manage Users section
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

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <AdminSidebar onManageUsersClick={scrollToManageUsers} onManageDashboardClick={scrollToDashboard

      } onManageSettingsClick={scrollToSettings} onManageClaimsClick={scrollToClaims}/>

      {/* Page Content */}
      <Container fluid className="p-4 content-area">
        <div ref={manageDashboardRef}>
        <Dashboard />
        </div>
        
        {/* Add ref to Manage Users section */}
        <div ref={manageUsersRef}>
          <ManageUsers />
        </div>
        <div ref={manageClaimsRef}>
          <ManageClaims />
        </div>
        <div ref={manageSettingsRef}>
          <Settings />
        </div>
      </Container>
      <Postlogin userType={"client"}/>
    </div>
    
  );
};

export default AdminHome;
