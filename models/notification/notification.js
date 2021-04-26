<<<<<<< HEAD
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  message: {
    type: String,
  },
  route: {
    type: String,
  },
  sendTo: [
    {
      userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      read: {
        type: Boolean,
        default: false,
      },
    },
  ],
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'EDR',
  },
  sendFrom: {
    type: String,
  },
  roPatient: {
    type: mongoose.Schema.ObjectId,
    ref: 'patientfhir',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('notification', notificationSchema);
=======
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  message: {
    type: String,
  },
  route: {
    type: String,
  },
  sendTo: [
    {
      userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      read: {
        type: Boolean,
        default: false,
      },
    },
  ],
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'EDR',
  },
  sendFrom: {
    type: String,
  },
  roPatient: {
    type: mongoose.Schema.ObjectId,
    ref: 'patientfhir',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('notification', notificationSchema);
>>>>>>> 4f26af1c912ada7e85841966a9f754517c018ecb
