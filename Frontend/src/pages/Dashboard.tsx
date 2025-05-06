import React from "react";
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Button,
  Card,
  Table,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import TaskManager from "../components/TaskManager"; // Import TaskManager

// Define types for the data
interface ChartData {
  name: string;
  value: number;
}

interface CardStat {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const Dashboard: React.FC = () => {
  // Chart data
  const chartHoursData: ChartData[] = [
    { name: "9:00", value: 287 },
    { name: "12:00", value: 385 },
    { name: "15:00", value: 490 },
    { name: "18:00", value: 492 },
    { name: "21:00", value: 554 },
    { name: "00:00", value: 586 },
    { name: "3:00", value: 698 },
    { name: "6:00", value: 695 },
  ];

  const chartPreferencesData: ChartData[] = [
    { name: "Ouverts", value: 40 },
    { name: "Rebonds", value: 20 },
    { name: "Désabonnés", value: 40 },
  ];

  const chartActivityData: ChartData[] = [
    { name: "Jan", value: 542 },
    { name: "Fév", value: 443 },
    { name: "Mar", value: 320 },
    { name: "Avr", value: 780 },
    { name: "Mai", value: 553 },
    { name: "Juin", value: 453 },
    { name: "Juil", value: 326 },
    { name: "Août", value: 434 },
    { name: "Sep", value: 568 },
    { name: "Oct", value: 610 },
    { name: "Nov", value: 756 },
    { name: "Déc", value: 895 },
  ];

  // Card stats data
  const cardStats: CardStat[] = [
    { title: "Stockage", value: "150GB", icon: "fas fa-chart-line", color: "warning" },
    { title: "Revenus", value: "1 345 €", icon: "fas fa-lightbulb", color: "success" },
    { title: "Erreurs", value: "23", icon: "fas fa-exclamation-triangle", color: "danger" },
    { title: "Abonnés", value: "+45K", icon: "fas fa-heart", color: "primary" },
  ];

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  return (
    <div>
      {/* Main Content */}
      <div className="main-content">
        <Container fluid>
          {/* Cards Row */}
          <Row>
            {cardStats.map((item, index) => (
              <Col lg="3" sm="6" key={index}>
                <Card className="card-stats">
                  <Card.Body>
                    <Row>
                      <Col xs="5">
                        <div className={`icon-big text-center icon-${item.color}`}>
                          <i className={`${item.icon} text-${item.color}`}></i>
                        </div>
                      </Col>
                      <Col xs="7">
                        <div className="numbers">
                          <p className="card-category">{item.title}</p>
                          <Card.Title as="h4">{item.value}</Card.Title>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer>
                    <hr />
                    <div className="stats">
                      <i className="fas fa-redo mr-1"></i>
                      Mettre à jour
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Charts Row */}
          <Row>
            <Col md="8">
              <Card>
                <Card.Header>
                  <Card.Title as="h4">Comportement des utilisateurs</Card.Title>
                  <p className="card-category">Performances sur 24 heures</p>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartHoursData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
                <Card.Footer>
                  <div className="legend">
                    <i className="fas fa-circle text-info"></i> Ouverts{" "}
                    <i className="fas fa-circle text-danger"></i> Clics{" "}
                    <i className="fas fa-circle text-warning"></i> Second clic
                  </div>
                  <hr />
                  <div className="stats">
                    <i className="fas fa-history"></i> Mis à jour il y a 3 minutes
                  </div>
                </Card.Footer>
              </Card>
            </Col>
            <Col md="4">
              <Card>
                <Card.Header>
                  <Card.Title as="h4">Statistiques emails</Card.Title>
                  <p className="card-category">Performance de la dernière campagne</p>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartPreferencesData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label
                      >
                        {chartPreferencesData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Task Manager Component */}
          <Row>
            <Col md="12">
              <Card>
                <Card.Body>
                  <TaskManager /> {/* Render TaskManager here */}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Dashboard;