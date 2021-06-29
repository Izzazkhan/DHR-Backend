const mongoose = require('mongoose');

const cronFlagSchema = new mongoose.Schema({
  taskName: String,
  taskAssignTime: Date,
  taskFlagTime: Number,
  status: String,
  collectionName: String,
  staffId: String,
});

module.exports = mongoose.model('CronFlag', cronFlagSchema);
