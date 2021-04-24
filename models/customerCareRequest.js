const mongoose = require('mongoose');

const ccRequestSchema = new mongoose.Schema({
  requestNo: String,
  edrId: {
    type: mongoose.Schema.ObjectId,
    ref: 'EDR',
  },
  status: String,
  staffId: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  dischargeStatus: String,
  requestedFor: String,
  costomerCareId: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  requestedAt: Date,
  deliveryStartTime: Date,
  completedAt: Date,
  pharmacyRequestId: {
    type: String,
  },
});

module.exports = mongoose.model('CCRequest', ccRequestSchema);
