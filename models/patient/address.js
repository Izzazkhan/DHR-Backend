<<<<<<< HEAD
<<<<<<< HEAD
const period = require('./common/period');
// address
const address = {
  use: {
    type: String,
    //  enum: ['home', 'work', 'temp', 'old', 'billing']
  },
  type: {
    type: String,
    // enum: ['postal', 'physical', 'both']
  },
  text: String,
  line: [String],
  city: String,
  district: String,
  state: String,
  postalCode: String,
  country: String,
  period: period.period,
};

module.exports = { address };
=======
=======
>>>>>>> 4f26af1c912ada7e85841966a9f754517c018ecb
const period = require('./common/period');
// address
const address = {
  use: {
    type: String,
    //  enum: ['home', 'work', 'temp', 'old', 'billing']
  },
  type: {
    type: String,
    // enum: ['postal', 'physical', 'both']
  },
  text: String,
  line: [String],
  city: String,
  district: String,
  state: String,
  postalCode: String,
  country: String,
  period: period.period,
};

module.exports = { address };
<<<<<<< HEAD
>>>>>>> 4f26af1c912ada7e85841966a9f754517c018ecb
=======
>>>>>>> 4f26af1c912ada7e85841966a9f754517c018ecb
