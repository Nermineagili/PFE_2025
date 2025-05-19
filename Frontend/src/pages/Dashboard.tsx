import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Container } from "react-bootstrap";
import axios from "axios";
import TaskManager from "../components/TaskManager";
import "./Dashboard.css";

// Define types for the data
interface ChartData {
  name: string;
  value: number;
}

interface CardStat {
  title: string;
  total: string | number;
  lastMonth: string | number;
  icon: string;
  color: string;
  growth: number;
}

interface ClaimData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  incidentDescription: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  userId: { _id: string; name: string; email: string };
}

interface SummaryStats {
  totalUsersAllTime: number;
  totalUsersLastMonth: number;
  totalClaimsAllTime: number;
  totalClaimsLastMonth: number;
  totalContractsAllTime: number;
  totalContractsLastMonth: number;
  pendingClaims: number;
  revenueAllTime: number;
  revenueLastMonth: number;
  totalUsersGrowth: number;
  totalClaimsGrowth: number;
  totalContractsGrowth: number;
  revenueGrowth: number;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalUsersAllTime: 0,
    totalUsersLastMonth: 0,
    totalClaimsAllTime: 0,
    totalClaimsLastMonth: 0,
    totalContractsAllTime: 0,
    totalContractsLastMonth: 0,
    pendingClaims: 0,
    revenueAllTime: 0,
    revenueLastMonth: 0,
    totalUsersGrowth: 0,
    totalClaimsGrowth: 0,
    totalContractsGrowth: 0,
    revenueGrowth: 0,
  });
  const [policyTypeData, setPolicyTypeData] = useState<ChartData[]>([]);
  const [claimStatusData, setClaimStatusData] = useState<ChartData[]>([]);
  const [contractActivityData, setContractActivityData] = useState<ChartData[]>([]);

  // Colors matching your platform's theme
  const PRIMARY_COLOR = "#1f618d";
  const SECONDARY_COLOR = "#c29046";
  const COLORS = [PRIMARY_COLOR, SECONDARY_COLOR, "#2ecc71", "#e74c3c", "#9b59b6", "#34495e", "#f1c40f"];
  const STATUS_COLORS: { [key: string]: string } = {
    pending: "#f1c40f",
    approved: "#2ecc71",
    rejected: "#e74c3c",
    active: PRIMARY_COLOR,
    pending_payment: "#f39c12",
    expired: "#e74c3c",
    cancelled: "#e74c3c",
    pending_renewal: "#f1c40f",
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Veuillez vous connecter pour accéder au tableau de bord");
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [
          statsRes,
          claimsRes,
          policyTypesRes,
          contractActivityRes,
        ] = await Promise.all([
          axios.get<SummaryStats>("http://localhost:5000/api/dashboard/stats", { headers }).catch(() => ({
            data: {
              totalUsersAllTime: 0,
              totalUsersLastMonth: 0,
              totalClaimsAllTime: 0,
              totalClaimsLastMonth: 0,
              totalContractsAllTime: 0,
              totalContractsLastMonth: 0,
              pendingClaims: 0,
              revenueAllTime: 0,
              revenueLastMonth: 0,
              totalUsersGrowth: 0,
              totalClaimsGrowth: 0,
              totalContractsGrowth: 0,
              revenueGrowth: 0,
            },
          })),
          axios.get<ClaimData[]>("http://localhost:5000/api/dashboard/claims", { headers }).catch(() => ({ data: [] })),
          axios.get<ChartData[]>("http://localhost:5000/api/dashboard/policy-types", { headers }).catch(() => ({ data: [] })),
          axios.get<ChartData[]>("http://localhost:5000/api/dashboard/contract-activity", { headers }).catch(() => ({
            data: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"].map(month => ({ name: month, value: 0 })),
          })),
        ]);

        setSummaryStats(statsRes.data);
        setClaims(claimsRes.data);
        setPolicyTypeData(
          policyTypesRes.data.map(item => ({
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
            value: item.value,
          }))
        );
        setContractActivityData(contractActivityRes.data);

        if (claimsRes.data.length > 0) {
          const statusCounts: { [key: string]: number } = {
            pending: 0,
            approved: 0,
            rejected: 0,
          };
          claimsRes.data.forEach((claim) => {
            statusCounts[claim.status] = (statusCounts[claim.status] || 0) + 1;
          });
          const statusData = Object.keys(statusCounts).map((key) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: statusCounts[key],
          }));
          setClaimStatusData(statusData);
        } else {
          setClaimStatusData([
            { name: "Pending", value: 0 },
            { name: "Approved", value: 0 },
            { name: "Rejected", value: 0 },
          ]);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        const errorMessage =
          err.response?.status === 401
            ? "Veuillez vous connecter à nouveau"
            : err.response?.status === 403
            ? "Accès refusé : droits insuffisants"
            : err.response?.status === 500
            ? `Erreur serveur: ${err.response?.data?.details || err.message}`
            : err.message || "Erreur lors du chargement des données du tableau de bord";
        setError(errorMessage);
        if (err.response?.status === 401) {
          localStorage.removeItem("authToken");
          window.location.href = "/login";
        }
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  };

  // Get badge color based on status
  const getBadgeColor = (status: string): string => {
    return STATUS_COLORS[status] || "#6c757d";
  };

  // Calculate stats for cards
  const cardStats: CardStat[] = [
    {
      title: "Utilisateurs",
      total: summaryStats.totalUsersAllTime,
      lastMonth: summaryStats.totalUsersLastMonth,
      icon: "fas fa-users",
      color: PRIMARY_COLOR,
      growth: summaryStats.totalUsersGrowth,
    },
    {
      title: "Contrats",
      total: summaryStats.totalContractsAllTime,
      lastMonth: summaryStats.totalContractsLastMonth,
      icon: "fas fa-file-contract",
      color: SECONDARY_COLOR,
      growth: summaryStats.totalContractsGrowth,
    },
    {
      title: "Réclamations",
      total: summaryStats.totalClaimsAllTime,
      lastMonth: summaryStats.totalClaimsLastMonth,
      icon: "fas fa-clipboard-list",
      color: "#2ecc71",
      growth: summaryStats.totalClaimsGrowth,
    },
    {
      title: "Revenus",
      total: formatCurrency(summaryStats.revenueAllTime),
      lastMonth: formatCurrency(summaryStats.revenueLastMonth),
      icon: "fas fa-euro-sign",
      color: "#9b59b6",
      growth: summaryStats.revenueGrowth,
    },
  ];

  if (loading) {
    return (
      <div className="yomi-loading-container">
        <div className="yomi-loading-spinner">
          <div className="spinner"></div>
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="yomi-error-container">
        <div className="yomi-error-card">
          <div className="yomi-error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Erreur</h3>
          <p>{error}</p>
          <button className="yomi-error-button" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="yomi-dashboard">
      <Container fluid>
        
        {/* Stats Cards Row */}
        <div className="yomi-stats-grid">
          {cardStats.map((item, index) => (
            <div className="yomi-stat-card" key={index}>
              <div className="yomi-stat-card-icon" style={{ backgroundColor: item.color }}>
                <i className={item.icon}></i>
              </div>
              <div className="yomi-stat-card-content">
                <h3 className="yomi-stat-card-value">{item.total}</h3>
                <p className="yomi-stat-card-title">{item.title}</p>
                <div className="yomi-stat-card-last-month">
                  {item.lastMonth} {item.title.toLowerCase().includes("revenus") ? "gagnés" : "ajoutés"} le dernier mois
                </div>
                <div className="yomi-stat-card-growth">
                  <span className={item.growth >= 0 ? "yomi-growth-positive" : "yomi-growth-negative"}>
                    <i className={item.growth >= 0 ? "fas fa-arrow-up" : "fas fa-arrow-down"}></i> {Math.abs(item.growth)}%
                  </span>
                  <span className="yomi-growth-period">vs. mois précédent</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alert for Pending Claims */}
        {summaryStats.pendingClaims > 0 && (
          <div className="yomi-alert-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <strong>{summaryStats.pendingClaims} réclamations en attente</strong> nécessitent votre attention.
          </div>
        )}

        {/* Main Content */}
        <div className="yomi-main-content">
          <div className="yomi-tab-content">
            <div className="yomi-tab-pane">
              <div className="yomi-charts-grid">
                {/* Activity Chart */}
                <div className="yomi-chart-card yomi-chart-lg">
                  <div className="yomi-chart-header">
                    <h3>Activité des contrats par mois</h3>
                    <div className="yomi-chart-actions">
                      <button className="yomi-chart-action-btn active">Année</button>
                      <button className="yomi-chart-action-btn">6 mois</button>
                      <button className="yomi-chart-action-btn">3 mois</button>
                    </div>
                  </div>
                  <div className="yomi-chart-body">
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={contractActivityData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                        <Area type="monotone" dataKey="value" stroke={PRIMARY_COLOR} fillOpacity={1} fill="url(#colorValue)" name="Contrats" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Policy Types Pie Chart */}
                <div className="yomi-chart-card">
                  <div className="yomi-chart-header">
                    <h3>Types de polices</h3>
                    <div className="yomi-chart-legend">
                      {policyTypeData.map((entry, index) => (
                        <div className="yomi-chart-legend-item" key={index}>
                          <span className="yomi-legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="yomi-legend-label">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="yomi-chart-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={policyTypeData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {policyTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} contrats`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Claim Status Chart */}
                <div className="yomi-chart-card">
                  <div className="yomi-chart-header">
                    <h3>Statut des réclamations</h3>
                    <div className="yomi-chart-legend">
                      {claimStatusData.map((entry, index) => (
                        <div className="yomi-chart-legend-item" key={index}>
                          <span className="yomi-legend-dot" style={{ backgroundColor: STATUS_COLORS[entry.name.toLowerCase()] }}></span>
                          <span className="yomi-legend-label">{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="yomi-chart-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={claimStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {claimStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || "#8884d8"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="yomi-chart-card">
                  <div className="yomi-chart-header">
                    <h3>Activité récente</h3>

                  </div>
                  <div className="yomi-chart-body yomi-recent-activity">
                    {claims.slice(0, 5).length > 0 ? (
                      claims.slice(0, 5).map((claim) => (
                        <div className="yomi-activity-item" key={claim._id}>
                          <div className="yomi-activity-icon">
                            <i className="fas fa-file-alt" style={{ color: getBadgeColor(claim.status) }}></i>
                          </div>
                          <div className="yomi-activity-content">
                            <div className="yomi-activity-title">
                              {claim.userId?.name || `${claim.firstName} ${claim.lastName}`}
                            </div>
                            <div className="yomi-activity-subtitle">
                              Réclamation - {formatDate(claim.createdAt)}
                            </div>
                          </div>
                          <div className="yomi-activity-status">
                            <span className="yomi-status-badge" style={{ backgroundColor: getBadgeColor(claim.status) }}>
                              {claim.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="yomi-no-data">
                        <i className="fas fa-info-circle"></i>
                        <p>Aucune réclamation récente</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Manager Component */}
        {/* <div className="yomi-chart-card">
          <div className="yomi-chart-header">
            <h3>Gestionnaire de tâches</h3>
          </div>
          <div className="yomi-chart-body">
            <TaskManager />
          </div>
        </div> */}
      </Container>
    </div>
  );
};

export default Dashboard;