const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftId: {
    type: String,
  },
  name: {
    type: String,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
});
