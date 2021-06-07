const mongoose = require('mongoose');

const MergeRequestSchema = new mongoose.Schema({
  newPatientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'patientfhir',
  },
  oldPatientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'patientfhir',
  },
  edrId: {
    type: mongoose.Schema.ObjectId,
    ref: 'EDR',
  },
});

module.exports = mongoose.model('MergeRequest', MergeRequestSchema);
