const mongoose = require('mongoose');

const TransferSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: 'patient',
    },
    productionArea: {
      type: mongoose.Schema.ObjectId,
      ref: 'ProductionArea',
    },
    transferOfCare: {
      type: mongoose.Schema.ObjectId,
      ref: 'TransferOfCare',
    },
    status: {
      type: String,
      enum: ['Progress', 'InProgress', 'Transfered'],
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('Transfer', TransferSchema);
