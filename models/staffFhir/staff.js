const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mongoosePaginate = require('mongoose-paginate-v2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
    additionalRole: {
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

    email: {
      type: String,
    },
    password: {
      type: String,
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
          ref: 'staff',
        },
        assignedTime: {
          type: Date,
        },
      },
    ],
    shift: {
      type: mongoose.Schema.ObjectId,
      ref: 'Shift',
    },
    // Tokens
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    passwordChangedAt: Date,
  },

  {
    timestamps: true,
  }
);

staffSchema.pre('save', async function (next) {
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

// Password Reset Token
staffSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log(resetToken, this.resetPasswordToken);
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// Setting user password changed at property
staffSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

staffSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('staff', staffSchema);
