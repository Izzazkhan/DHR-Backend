const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const name = require('./humanName');
const telecom = require('./contactPoint');
const address = require('./address');
const contact = require('./contact');
const photo = require('./attachment');
const payment = require('./paymentNotice');

const patientSchema = new mongoose.Schema({
  identifier: [
    {
      value: { type: String },
    },
  ],
  name: [name.humanName],
  telecom: [telecom.contactPoint],
  gender: {
    type: String,
  },
  phoneNumber: {
    type: Number,
  },
  birthDate: {
    type: Date,
  },
  deceasedBoolean: {
    type: Boolean,
  },
  deceasedDateTime: {
    type: Date,
  },
  address: [address.address],
  maritalStatus: {
    type: String,
  },
  multipleBirthBoolean: {
    type: Boolean,
  },
  multipleBirthInteger: {
    type: Number,
  },
  photo: [photo.attachment],
  contact: [contact.contact],
  generalPractitioner: [
    { type: mongoose.Schema.ObjectId, ref: 'generalPractitioner' },
  ],
  managingOrganization: {
    type: mongoose.Schema.ObjectId,
    ref: 'managingOrganization',
  },
  registrationStatus: {
    type: String,
    // default: 'pending',
  },
  assignedStatus: [{ type: String }],
  paymentMethod: [payment.payment],
  nationalID: { type: String },
  age: { type: Number },
  height: { type: Number },
  weight: { type: Number },
  nationality: { type: String },
  blood: { type: String },
  idCardFront: { type: String },
  idCardBack: { type: String },
  otherDetails: { type: String },
  date: { type: Date },
  insuranceNumber: { type: String },
  insuranceVendor: { type: String },
  coverageTerms: { type: String },
  coPayment: { type: Number },
  coveredFamilyMember: [contact.contact],
  coverageDetails: { type: String },
  insuranceDetails: { type: String },
  insuranceCard: { type: String },
  processTime: [
    {
      processStartTime: {
        type: Date,
      },
      processEndTime: {
        type: Date,
      },
      // role: {
      //   type: String,
      // },
      senderID: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      processName: {
        type: String,
        enum: ['registration', 'sensie', 'paramedics'],
      },
    },
  ],

  QR:{
    type:String
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
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
});

patientSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('patientfhir', patientSchema);
