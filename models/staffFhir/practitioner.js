const mongoose = require('mongoose');
const name = require('../patient/humanName');
const telecom = require('../patient/contactPoint');
const address = require('../patient/address');
const photo = require('../patient/attachment');
const period = require('../patient/common/period');

const practitionerSchema = new mongoose.Schema({
  identifier: [
    {
      value: { type: String },
    },
  ],
  active: {
    type: Boolean,
  },
  name: [name.humanName],
  telecom: [telecom.contactPoint],
  address: [address.address],
  gender: {
    type: String,
  },
  birthDate: {
    type: Date,
  },
  photo: [photo.attachment],
  qualification: {
    // Certification, licenses, or training pertaining to the provision of care
    identifier: [
      {
        value: { type: String },
      },
    ],
    code: {
      text: {
        type: String,
        // Required:true
        // Plain text representation of the qualification
      },
    },
    period: period.period,
    // Period during which the qualification is valid
    issuer: {
      // Organization that regulates and issues the qualification
      type: String,
    },
  },
  communication: {
    text: {
      type: String,
      //   Language of Communication
    },
  },
});

module.exports = mongoose.model('Practitioner', practitionerSchema);
