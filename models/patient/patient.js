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
  status: {
    type: String,
    default: 'pending',
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

patientSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('patientfhir', patientSchema);
