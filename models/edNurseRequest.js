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
});

module.exports = mongoose.model('edNurse', edNurseSchema);
