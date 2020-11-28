const mongoose = require('mongoose');
const humanName = require('../patient/humanName');
const telecom = require('../patient/contactPoint');
const address = require('../patient/address');
const attachment = require('../patient/attachment');

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
  },
});
