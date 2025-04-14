const express = require("express");
const cors = require("cors");
const path = require("path");
const userRoutes = require("./routes/user")
const authRoutes = require("./routes/auth");
const claimRoutes = require('./routes/claim');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/ContactRoutes');
const taskRoutes = require('./routes/taskRoutes');
const contratRoutes = require('./routes/ContratRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');

require("dotenv").config();
require("./db");
const bodyParser = require("body-parser");

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: "http://127.0.0.1:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
    credentials: true, // Allow cookies/session
  })
);

// Handle preflight OPTIONS requests
app.options("*", cors());

// Serve images statically from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body parser and JSON parsing
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));


app.get("/", (req, res) => {
  res.send("🚀 Express server is running!");
});
// Import routes

app.use("/api/auth", authRoutes);

app.use("/api/user", userRoutes);

app.use('/api/claims', claimRoutes);

app.use('/api/admin', adminRoutes); // Register admin routes

app.use("/api", contactRoutes);

app.use("/api/tasks", taskRoutes);

app.use('/api/contracts', contratRoutes);  // This line links the routes to /api/contracts


app.use('/api/supervisor', supervisorRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});