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
    { name: "9:00AM", value: 287 },
    { name: "12:00AM", value: 385 },
    { name: "3:00PM", value: 490 },
    { name: "6:00PM", value: 492 },
    { name: "9:00PM", value: 554 },
    { name: "12:00PM", value: 586 },
    { name: "3:00AM", value: 698 },
    { name: "6:00AM", value: 695 },
  ];

  const chartPreferencesData: ChartData[] = [
    { name: "Open", value: 40 },
    { name: "Bounce", value: 20 },
    { name: "Unsubscribe", value: 40 },
  ];

  const chartActivityData: ChartData[] = [
    { name: "Jan", value: 542 },
    { name: "Feb", value: 443 },
    { name: "Mar", value: 320 },
    { name: "Apr", value: 780 },
    { name: "May", value: 553 },
    { name: "Jun", value: 453 },
    { name: "Jul", value: 326 },
    { name: "Aug", value: 434 },
    { name: "Sep", value: 568 },
    { name: "Oct", value: 610 },
    { name: "Nov", value: 756 },
    { name: "Dec", value: 895 },
  ];

  // Card stats data
  const cardStats: CardStat[] = [
    { title: "Number", value: "150GB", icon: "fas fa-chart-line", color: "warning" },
    { title: "Revenue", value: "$ 1,345", icon: "fas fa-lightbulb", color: "success" },
    { title: "Errors", value: "23", icon: "fas fa-exclamation-triangle", color: "danger" },
    { title: "Followers", value: "+45K", icon: "fas fa-heart", color: "primary" },
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
                      Update Now
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
                  <Card.Title as="h4">Users Behavior</Card.Title>
                  <p className="card-category">24 Hours performance</p>
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
                    <i className="fas fa-circle text-info"></i> Open{" "}
                    <i className="fas fa-circle text-danger"></i> Click{" "}
                    <i className="fas fa-circle text-warning"></i> Click Second Time
                  </div>
                  <hr />
                  <div className="stats">
                    <i className="fas fa-history"></i> Updated 3 minutes ago
                  </div>
                </Card.Footer>
              </Card>
            </Col>
            <Col md="4">
              <Card>
                <Card.Header>
                  <Card.Title as="h4">Email Statistics</Card.Title>
                  <p className="card-category">Last Campaign Performance</p>
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
