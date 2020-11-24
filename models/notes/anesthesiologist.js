const mongoose = require("mongoose");

const AnesthesiologistSchema = new mongoose.Schema({
  date: {
    type: Date,
  },
  requestID: {
    type: Number,
  },
  anesthesiologistRef: {
    type: mongoose.Schema.ObjectId,
    ref: "staff",
  },
  voiceNotes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Completed"],
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

module.exports = mongoose.model("Anesthesiologist", AnesthesiologistSchema);
