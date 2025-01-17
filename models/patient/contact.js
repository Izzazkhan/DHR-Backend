const mongoose = require('mongoose');
const period = require('./common/period');
const address = require('./address');
const telecom = require('./contactPoint');

const contact = {
  relationship: [
    {
      type: String,
      // equilent to codeableconcept
    },
  ],
  name: { type: String },
  telecom: [telecom.contactPoint],
  address: address.address,
  gender: { type: String },
  organization: { type: mongoose.Schema.ObjectId },
  period: period.period,
  // we have added it
  typeOfRelation: {
    type: String,
    // enum: ['mother', 'sister'], // etc
  },
};

module.exports = { contact };
