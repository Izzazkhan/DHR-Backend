const mongoose = require("mongoose");

const EDDoctorSchema = new mongoose.Schema({
  date: {
    type: Date,
  },
  condition: {
    type: String,
  },
  doctor: {
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

module.exports = mongoose.model("EDDoctor", EDDoctorSchema);
