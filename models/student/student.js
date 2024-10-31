const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  gender: {
    type: String,
  },
  age: { type: Number },
});

module.exports = mongoose.model('Student', studentSchema);
