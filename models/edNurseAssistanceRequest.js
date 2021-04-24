const mongoose = require('mongoose');

const edNurseSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'patientfhir',
  },
  staffId: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  staffType: String,
  reason: String,
  status:{type:String,default:"pending"},
  remarks:{type:String},
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('assistanceRequest', edNurseSchema);
