const mongoose = require('mongoose');

const assistanceRequestSchema = new mongoose.Schema({
  requestCategory: {
    type: String,
  },
  assistanceId: {
    type: mongoose.Schema.ObjectId,
  },
  assistanceName: String,
  reason: String,
});

module.exports = mongoose.model('assistanceRequest', assistanceRequestSchema);
