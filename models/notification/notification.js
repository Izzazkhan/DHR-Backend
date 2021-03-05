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
  sendFrom: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('notification', notificationSchema);
