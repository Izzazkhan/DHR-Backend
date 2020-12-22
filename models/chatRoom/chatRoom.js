const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participant1: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  participant2: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  chat: [
    {
      message: {
        type: String,
      },
      msgType: {
        type: String,
        default: '',
      },
      sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      receiver: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      read: {
        type: Boolean,
        default: false,
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model('chatroom', chatSchema);
