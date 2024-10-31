const mongoose = require('mongoose');

const ssrchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Student',
  },
});

module.exports = mongoose.model('SSR', ssrchema);
