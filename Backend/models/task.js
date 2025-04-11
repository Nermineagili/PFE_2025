const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ["pending", "in-progress", "completed"],  // Correct enum values
    default: "pending" // You can set a default value if none is provided
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
