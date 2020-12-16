const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mongoosePaginate = require('mongoose-paginate-v2');
const jwt = require('jsonwebtoken');
const name = require('../patient/humanName');
const telecom = require('../patient/contactPoint');
const address = require('../patient/address');
const photo = require('../patient/attachment');
// const chiefComplaint = require('../chiefComplaint/chiefComplaint');

const staffSchema = new mongoose.Schema(
  {
    identifier: [
      {
        value: { type: String },
      },
    ],
    staffId: {
      type: String,
    },
    staff: {
      type: String,
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
    specialty: [
      {
        type: String,
      },
    ],
    nationality: {
      type: String,
    },
    staffType: {
      type: String,
    },
    subType: [
      {
        type: String,
      },
    ],
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

    email: {
      type: String,
      // required: [true, 'Please add an email'],
      // unique: true,
      // match: [
      //   /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      //   'Please add a valid email',
      // ],
    },
    password: {
      type: String,
      // required: [true, 'Please add a password'],
      // minlength: 6,
    },
    communication: [
      {
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    availability: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    updateRecord: [
      {
        updatedAt: {
          type: Date,
        },
        updatedBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'staff',
        },
        reason: {
          type: String,
        },
      },
    ],
    chiefComplaint: [
      {
        chiefComplaintId: {
          type: mongoose.Schema.ObjectId,
          ref: 'chiefComplaint',
        },
        assignedBy: {
          type: mongoose.Schema.ObjectId,
        },
        assignedTime: {
          type: Date,
        },
      },
    ],
    shiftStartTime: {
      type: Date,
    },
    shiftEndTime: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);

staffSchema.pre('save', async function (next) {
  // console.log('Pre Save');
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
staffSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return
staffSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

staffSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('staff', staffSchema);
