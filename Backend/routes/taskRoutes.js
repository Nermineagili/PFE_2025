const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
console.log("DEBUG TASK CONTROLLER:", taskController);

const { authenticateToken, checkAdmin } = require("../middleware/authMiddleware");
console.log('DEBUG in taskRoutes:', { authenticateToken, checkAdmin, taskController });

router.get("/", authenticateToken, taskController.getTasks);
router.get("/:id", authenticateToken, taskController.getTaskById);
router.post("/", authenticateToken, checkAdmin, taskController.createTask);
router.put("/:id", authenticateToken, checkAdmin, taskController.updateTask);
router.delete("/:id", authenticateToken, checkAdmin, taskController.deleteTask);

module.exports = router;
