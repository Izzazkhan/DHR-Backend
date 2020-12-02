const mongoose = require('mongoose');
const name = require('../patient/humanName');
const telecom = require('../patient/contactPoint');
const address = require('../patient/address');
const photo = require('../patient/attachment');

const staffSchema = new mongoose.Schema(
  {
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
    age: {
      type: Number,
    },
    birthDate: {
      type: Date,
    },
    specialty: {
      type: String,
    },
    nationality: {
      type: String,
    },
    staffType: {
      type: String,
    },
    photo: [photo.attachment],
    education: [
      {
        institution: {
          type: String,
        },
        subject: {
          type: String,
        },
        degree: {
          type: String,
        },
        grade: {
          type: String,
        },
      },
    ],

    experience: [
      {
        hospitalName: {
          type: String,
        },
        location: {
          type: String,
        },
        jobPosition: {
          type: String,
        },
        experience: {
          type: String,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        currentlyWorking: {
          type: Boolean,
          default: false,
        },
      },
    ],

    accountInformation: {
      email: {
        type: String,
      },
      password: {
        type: String,
      },
    },
    communication: {
      text: {
        type: String,
        //   Language of Communication
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('staff', staffSchema);
