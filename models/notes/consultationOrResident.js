const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
  consultationNo: {
    type: String,
  },
  identifier: [{ value: String }],
  issued: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
  code: [{ code: String, display: String }],
  note: {
    type: String,
  },
  doctorNotes: {
    type: String,
  },
  audioNotes: {
    type: String,
  },
  status: {
    type: String,
  },
  speciality: {
    type: String,
  },
  specialist: {
    type: String,
  },
  performer: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  consultant: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
});

module.exports = mongoose.model('consultation', ConsultationSchema);
