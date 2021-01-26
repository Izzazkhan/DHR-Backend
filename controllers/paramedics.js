const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

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
  const transferredEdr = await EDR.findOneAndUpdate(
    { _id: req.params.edrId },
    { $set: { patientInHospital: true } },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: transferredEdr,
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
