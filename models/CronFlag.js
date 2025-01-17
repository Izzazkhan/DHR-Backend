const mongoose = require('mongoose');

const cronFlagSchema = new mongoose.Schema({
  taskName: String,
  taskAssignTime: Date,
  taskFlagTime: Number,
  status: String,
  collectionName: String,
  staffId: String,
  //   edrId: {
  //     type: mongoose.Schema.ObjectId,
  //     ref: 'EDR',
  //   },
  patientId: {
    type: mongoose.Schema.ObjectId,
    refPath: 'onModel',
  },
  onModel: {
    type: String,
  },
  // Other Staff
  generatedFrom: {
    type: String,
  },
  // Sensei
  generatedFor: [{ type: String }],
  card: String,
  reason: {
    type: String,
  },
  emittedFor: String,
  requestId: String,
});

module.exports = mongoose.model('CronFlag', cronFlagSchema);
