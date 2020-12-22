const mongoose = require("mongoose");

const CommunicationRequestSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  reason: {
    type: String,
  },
  date: {
    type: Date,
  },
  date: {
    type: Date,
  },
  requester: {
    type: mongoose.Schema.ObjectId,
    ref: "staff",
  },
  others: {
    type: String,
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

module.exports = mongoose.model(
  "CommunicationRequest",
  CommunicationRequestSchema,
);
