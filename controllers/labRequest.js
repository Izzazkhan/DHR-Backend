// const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');

exports.getPendingLabEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    // {
    //   $match: {
    //     'labRequest.status': 'pending',
    //   },
    // }
    {
      $match: {
        $or: [
          { 'labRequest.status': 'pending' },
          { 'labRequest.status': 'active' },
          { 'labRequest.status': 'hold' },
        ],
      },
    },
  ]);

  const edrs = await EDR.populate(unwindEdr, [
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      select: 'chiefComplaintId',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          select: 'paName',
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
      //   select: 'identifier name',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);
  res.status(200).json({
    success: true,
    data: edrs,
  });
});

exports.getCompletedLabEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        'labRequest.status': 'completed',
      },
    },
  ]);

  const edrs = await EDR.populate(unwindEdr, [
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      select: 'chiefComplaintId',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          select: 'paName',
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
      //   select: 'identifier name',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);
  res.status(200).json({
    success: true,
    data: edrs,
  });
});

exports.updateLabRequest = asyncHandler(async (req, res, next) => {
  console.log(req.files);
  const parsed = JSON.parse(req.body.data);
  const lab = await EDR.findOne({ _id: parsed.edrId });
  let note;
  for (let i = 0; i < lab.labRequest.length; i++) {
    if (lab.labRequest[i]._id == parsed.labId) {
      //  image: [{ type: String }], image: [{ type: String }],sole.log(i);
      note = i;
    }
  }
  const arr = [];
  if (req.files) {
    for (let i = 0; i < req.files.length; i++) {
      arr.push(req.files[i].path);
    }
  }

  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: parsed.staffId,
    reason: parsed.reason,
  };
  await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { [`labRequest.${note}.updateRecord`]: updateRecord } },
    { new: true }
  );

  const updatedlab = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`labRequest.${note}.status`]: parsed.status,
        [`labRequest.${note}.delayedReason`]: parsed.delayedReason,
        // [`labRequest.${note}.activeTime`]: parsed.activeTime,
        // [`labRequest.${note}.completeTime`]: parsed.completeTime,
        // [`labRequest.${note}.holdTime`]: parsed.holdTime,
        // [`labRequest.${note}.voiceNotes`]: voiceNotes,
        [`labRequest.${note}.image`]: arr,
      },
    },
    { new: true }
  ).populate('labRequest.serviceId');
  res.status(200).json({
    success: true,
    data: updatedlab,
  });
});

exports.searchPendingLabRequest = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    labRequest: { $ne: [] },
    'labRequest.status': 'pending',
  }).populate('patientId');

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

exports.searchComletedLabRequest = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    labRequest: { $ne: [] },
    'labRequest.status': 'completed',
  }).populate('patientId');

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
