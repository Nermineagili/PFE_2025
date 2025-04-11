const Task = require("../models/task");

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks" });
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
    res.status(500).json({ message: "Error fetching task" });
  }
};

// Create a new task (Admin only)
exports.createTask = async (req, res) => {
    try {
      const { title, description, status } = req.body;
  
      // Check if all required fields are provided
      if (!title || !description || !status) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      console.log("Creating task with:", req.body); // Debugging log
  
      const newTask = new Task({ title, description, status });
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
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully", updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Error updating task" });
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
    res.status(500).json({ message: "Error deleting task" });
  }
};
