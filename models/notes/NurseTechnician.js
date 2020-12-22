const mongoose = require("mongoose");

const NurseTechnicianSchema = new mongoose.Schema({
  date: {
    type: Date,
  },
  requestID: {
    type: String,
  },
  taskDetails: {
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

module.exports = mongoose.model("NurseTechnician", NurseTechnicianSchema);
