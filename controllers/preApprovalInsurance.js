const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
const CareStream = require('../models/CareStreams/CareStreams');
const EDR = require('../models/EDR/EDR');
const IV = require('../models/insuranceVendor');
const IT = require('../models/insuranceItem');

exports.getPreApprovalEDR = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    status: 'pending',
    $or: [
      { labRequest: { $ne: [] } },
      { radiologyRequest: { $ne: [] } },
      { pharmacyRequest: { $ne: [] } },
    ],
    paymentMethod: 'Insured',
  }).populate('patientId');
  // .populate('consultationNote.requester');
  // .populate({
  //   path: 'pharmacyRequest',
  //   populate: [
  //     {
  //       path: 'item.itemId',
  //     },
  //   ],
  // )}
  // .populate('labRequest.requester')
  // .populate('labRequest.serviceId')
  // .populate('radiologyRequest.serviceId')
  // .populate('radiologyRequest.requester')
  // .populate('residentNotes.doctor')
  // .populate('residentNotes.doctorRef')
  // .populate('dischargeRequest.dischargeMedication.requester')
  // .populate('dischargeRequest.dischargeMedication.medicine.itemId');

  res.status(200).json({ success: true, data: edr });
});
