const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
const CareStream = require('../models/CareStreams/CareStreams');
const EDR = require('../models/EDR/EDR');
const IV = require('../models/insuranceVendor');
const IT = require('../models/insuranceItem');

exports.addInsuranceVendor = asyncHandler(async (req, res) => {
  //   console.log(req.body);
  const {
    name,
    poBox,
    zipCode,
    telephone1,
    telephone2,
    address,
    faxNo,
    email,
    country,
    city,
    taxNo,
    contractualDiscount,
    subCompanies,
    exceptions,
    agreedPricePolicy,
    paymentTerms,
    insuranceCodes,
  } = req.body;
  const insurance = await IV.create({
    name,
    poBox,
    zipCode,
    telephone1,
    telephone2,
    address,
    faxNo,
    email,
    country,
    city,
    taxNo,
    contractualDiscount,
    subCompanies,
    exceptions,
    agreedPricePolicy,
    paymentTerms,
    insuranceCodes,
  });
  res.status(200).json({ success: true, data: insurance });
});

exports.verify = asyncHandler(async (req, res, next) => {
  const verify = await IV.findOne({ insuranceCodes: req.params.id });
  if (verify) {
    const data = {
      vendor: verify.name,
      coverageDetail: 'Full Payment',
      insurerId: verify._id,
    };
    res.status(200).json({ success: true, data: data });
  } else {
    res.status(200).json({ success: false, data: 'resource not found' });
  }
});

exports.addInsuranceItem = asyncHandler(async (req, res) => {
  const {
    providerId,
    // itemId,
    laboratoryServiceId,
    radiologyServiceId,
    price,
    details,
  } = req.body;
  const insurance = await IT.create({
    providerId,
    // itemId,
    laboratoryServiceId,
    radiologyServiceId,
    price,
    details,
  });
  res.status(200).json({ success: true, data: insurance });
});
