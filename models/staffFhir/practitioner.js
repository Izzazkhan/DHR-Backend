const mongoose = require('mongoose');
const name = require('../patient/humanName');
const telecom = require('../patient/contactPoint');
const address = require('../patient/address');
const photo = require('../patient/attachment');

const practitionerSchema = new mongoose.Schema(
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
    birthDate: {
      type: Date,
    },
    specialty: {
      type: String,
    },
    nationality: {
      type: String,
    },
    photo: [photo.attachment],
    // qualification: {
    //   // Certification, licenses, or training pertaining to the provision of care
    //   identifier: [
    //     {
    //       value: { type: String },
    //     },
    //   ],
    //   code: {
    //     text: {
    //       type: String,
    //       // Required:true
    //       // Plain text representation of the qualification
    //     },
    //   },
    //   period: period.period,
    //   // Period during which the qualification is valid
    //   issuer: {
    //     // Organization that regulates and issues the qualification
    //     type: String,
    //   },
    // },
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
      userName: {
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

module.exports = mongoose.model('Practitioner', practitionerSchema);
