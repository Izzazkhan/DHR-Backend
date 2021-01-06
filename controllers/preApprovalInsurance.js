const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
// const CareStream = require('../models/CareStreams/CareStreams');
const EDR = require('../models/EDR/EDR');
const IV = require('../models/insuranceVendor');
const IT = require('../models/insuranceItem');
const PAR = require('../models/par');
const ErrorResponse = require('../utils/errorResponse');

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

exports.getEDRandIPRKeyword = asyncHandler(async (req, res) => {
  const patients = await EDR.find({
    status: 'pending',
    $or: [
      { labRequest: { $ne: [] } },
      { radiologyRequest: { $ne: [] } },
      { pharmacyRequest: { $ne: [] } },
    ],
    paymentMethod: 'Insured',
  }).populate('patientId');
  // .populate('consultationNote.requester')
  // .populate({
  //   path: 'pharmacyRequest',
  //   populate: [
  //     {
  //       path: 'item.itemId',
  //     },
  //   ],
  // })
  // .populate('labRequest.requester')
  // .populate('labRequest.serviceId')
  // .populate('radiologyRequest.serviceId')
  // .populate('radiologyRequest.requester')
  // .populate('residentNotes.doctor')
  // .populate('residentNotes.doctorRef')
  // .populate('dischargeRequest.dischargeMedication.requester')
  // .populate('dischargeRequest.dischargeMedication.medicine.itemId');
  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.addPAR = asyncHandler(async (req, res) => {
  const {
    edrId,
    iprId,
    // oprId,
    generatedBy,
    patient,
    pharId,
    lrId,
    rrId,
    nsId,
    generatedFrom,
    generatedFromSub,
    approvalNo,
    approvalPerson,
    comments,
    coPayment,
    netPayment,
    status,
  } = req.body;
  const par = await PAR.create({
    requestNo: 'PA' + requestNoFormat(new Date(), 'mmddyyHHmm'),
    edrId,
    iprId,
    // oprId,
    generatedBy,
    patient,
    pharId,
    lrId,
    rrId,
    nsId,
    generatedFrom,
    generatedFromSub,
    approvalNo,
    approvalPerson,
    comments,
    coPayment,
    netPayment,
    status,
  });
  res.status(200).json({ success: true, data: par });
});

exports.updatePAR = asyncHandler(async (req, res, next) => {
  const { _id } = req.body;
  let par = await PAR.findById(_id);
  if (!par) {
    return next(new ErrorResponse(`PAR not found with id of ${_id}`, 404));
  }
  par = await PAR.updateOne({ _id: _id }, req.body);
  res.status(200).json({ success: true, data: par });
});
