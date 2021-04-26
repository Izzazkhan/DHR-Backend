const requestNoFormat = require('dateformat');
const Pharm = require('../models/requests/pharm');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const generateReqNo = require('../components/requestNoGenerator');

exports.createPharmRequest = asyncHandler(async (req, res, next) => {
  const { subject, medication, dispenseRequest, dosage, status } = req.body;
  const requestNO = generateReqNo('Pharm');
  const medicationRequest = await Pharm.create({
    PharmRequestNo: requestNO,
    subject,
    medication,
    dispenseRequest,
    dosage,
    status,
  });
  res.status(201).json({
    success: true,
    data: medicationRequest,
  });
});

exports.getPharmRequest = asyncHandler(async (req, res, next) => {
  const options = {
    populate: [
      {
        path: 'subject',
      },
    ],
    sort: { $natural: -1 },
  };
  const pharmRequest = await Pharm.paginate({ status: 'pending' }, options);
  res.status(200).json({
    success: true,
    data: pharmRequest,
  });
});
