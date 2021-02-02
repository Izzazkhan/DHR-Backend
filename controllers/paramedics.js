const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const CCRequest = require('../models/customerCareRequest');
const Staff = require('../models/staffFhir/staff');

exports.paramedicsEdr = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
    patientInHospital: false,
  })
    .populate('patientId', 'identifier name age gender telecom createdAt')
    .select('patientId');
  res.status(200).json({
    success: true,
    data: paramedicsEdr,
  });
});

exports.edrTransfer = asyncHandler(async (req, res, next) => {
  // const transferredEdr = await EDR.findOneAndUpdate(
  //   { _id: req.params.edrId },
  //   { $set: { patientInHospital: true } },
  //   { new: true }
  // );

  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  // const requestNo = '' + day + requestNoFormat(new Date(), 'yyHHMMss');

  // Customer Care Request
  let startTimeCC;
  let endTimeCC;
  let currentTimeCC = new Date();

  currentTimeCC = currentTimeCC.toISOString().split('T')[1];
  // console.log(currentTimeCC);

  const CCrequestNo = 'TRID' + day + requestNoFormat(new Date(), 'yyHHMMss');
  const customerCares = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
    // availability: true,
  }).select('identifier name shiftStartTime shiftEndTime');
  const shiftCC = customerCares.filter((CC) => {
    startTimeCC = CC.shiftStartTime.toISOString().split('T')[1];
    endTimeCC = CC.shiftEndTime.toISOString().split('T')[1];
    if (currentTimeCC >= startTimeCC && currentTimeCC <= endTimeCC) {
      console.log(CC);
      return CC;
    }
  });

  const randomCC = Math.floor(Math.random() * (shiftCC.length - 1));
  console.log(randomCC);
  const customerCare = shiftCC[randomCC];

  const cc = await CCRequest.create({
    requestNo: CCrequestNo,
    edrId: req.body.edrId,
    status: 'pending',
    staffId: req.body.StaffId,
    requestedFor: 'Transfer',
    requestedAt: Date.now(),
    costomerCareId: customerCare._id,
  });
  res.status(200).json({
    success: true,
    data: cc,
  });
});

exports.transferredParamedicsEdr = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
    patientInHospital: true,
  })
    .populate('patientId', 'identifier name age gender telecom createdAt')
    .select('patientId');
  res.status(200).json({
    success: true,
    data: paramedicsEdr,
  });
});

exports.searchPendingPMEdr = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    patientInHospital: false,
    generatedFrom: 'Paramedics',
  })
    .select('patientId dcdFormStatus')
    .populate(
      'patientId',
      'name identifier telecom nationalID gender age createdAt'
    );

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
      //  break;
    }
  }

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchCompletedPMEdr = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    patientInHospital: true,
    generatedFrom: 'Paramedics',
  })
    .select('patientId dcdFormStatus')
    .populate(
      'patientId',
      'name identifier telecom nationalID gender age createdAt'
    );

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
      //  break;
    }
  }

  res.status(200).json({
    success: true,
    data: arr,
  });
});
