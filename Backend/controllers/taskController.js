const Task = require("../models/task");

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Error fetching task", error: error.message });
  }
};

// Create a new task (Admin only)
exports.createTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    // Check if required fields are provided
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    console.log("Creating task with:", req.body);

    const newTask = new Task({
      title,
      description,
      status: status || "pending" // Use provided status or default to "pending"
    });
    await newTask.save();

    res.status(201).json({ message: "Task created successfully", newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task", error: error.message });
  }
};

// Update a task (Admin only)
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    if (!title || !description || !status) {
      return res.status(400).json({ message: "Title, description, and status are required" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully", updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Error updating task", error: error.message });
  }
};

// Delete a task (Admin only)
exports.deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
};
