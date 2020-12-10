const mongoose = require("mongoose");

const EDNurseSchema = new mongoose.Schema({
  date: {
    type: Date,
  },
  taskDetails: {
    type: String,
  },
  observationNotes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Completed"],
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "staff",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("EDNurse", EDNurseSchema);
