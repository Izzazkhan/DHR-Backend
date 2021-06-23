const mongoose = require('mongoose');

const TransferToEDEOUSchema = new mongoose.Schema(
  {
    edrId: {
      type: mongoose.Schema.ObjectId,
      ref: 'EDR',
    },

    to: {
      type: String,
    },

    from: {
      type: String,
    },

    requestedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },

    requestedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    requestedAt: {
      type: Date,
    },

    status: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
    },
    inProgressTime: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    eouNurseAssigned: {
      type: Boolean,
      default: false,
    },
	eouNurseId:{
	  type: mongoose.Schema.ObjectId,
      ref: 'staff',
	}
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('TransferToEDEOU', TransferToEDEOUSchema);
