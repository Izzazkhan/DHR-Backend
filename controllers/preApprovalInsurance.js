const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
const CareStream = require('../models/CareStreams/CareStreams');
const EDR = require('../models/EDR/EDR');
const IV = require('../models/insuranceVendor');
const IT = require('../models/insuranceItem');

exports.getEDRandIPR = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    $or: [
      { labRequest: { $ne: [] } },
      { radiologyRequest: { $ne: [] } },
      { pharmacyRequest: { $ne: [] } },
    ],
    paymentMethod: 'Insurance',
  })
    .populate('patientId')
    .populate('consultationNote.requester')
    .populate({
      path: 'pharmacyRequest',
      populate: [
        {
          path: 'item.itemId',
        },
      ],
    })
    .populate('labRequest.requester')
    .populate('labRequest.serviceId')
    .populate('radiologyRequest.serviceId')
    .populate('radiologyRequest.requester')
    .populate('residentNotes.doctor')
    .populate('residentNotes.doctorRef')
    .populate('dischargeRequest.dischargeMedication.requester')
    .populate('dischargeRequest.dischargeMedication.medicine.itemId');
  const ipr = await IPR.find({
    $or: [
      { labRequest: { $ne: [] } },
      { radiologyRequest: { $ne: [] } },
      { pharmacyRequest: { $ne: [] } },
    ],
    paymentMethod: 'Insurance',
  })
    .populate('patientId')
    .populate('consultationNote.requester')
    .populate({
      path: 'pharmacyRequest',
      populate: [
        {
          path: 'item.itemId',
        },
      ],
    })
    .populate('labRequest.requester')
    .populate('labRequest.serviceId')
    .populate('radiologyRequest.serviceId')
    .populate('radiologyRequest.requester')
    .populate('residentNotes.doctor')
    .populate('residentNotes.doctorRef')
    .populate('nurseService.serviceId')
    .populate('nurseService.requester')
    .populate('dischargeRequest.dischargeMedication.requester')
    .populate('dischargeRequest.dischargeMedication.medicine.itemId');
  var dataF = [edr.concat(ipr)];
  var data = dataF[0];
  res.status(200).json({ success: true, data: data });
});
