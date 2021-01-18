const EDR = require('../models/EDR/EDR');
const HK = require('../models/houseKeepingRequest');
const asyncHandler = require('../middleware/async');

exports.getPendingRadEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        radRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        'radRequest.status': 'pending',
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
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
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

exports.getCompletedRadEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        radRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        'radRequest.status': 'completed',
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
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
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

exports.updateRadRequest = asyncHandler(async (req, res, next) => {
  console.log(req.files);
  const parsed = JSON.parse(req.body.data);
  const rad = await EDR.findOne({ _id: parsed.edrId });
  let note;
  for (let i = 0; i < rad.radRequest.length; i++) {
    if (rad.radRequest[i]._id == parsed.radId) {
      // console.log(i);
      note = i;
    }
  }
  let voiceNotes;
  const arr = [];
  if (req.files) {
    for (let i = 0; i < req.files.length; i++) {
      if (req.files[i].mimetype.includes('image')) {
        arr.push(req.files[i].path);
      }
      if (req.files[i].mimetype.includes('audio')) {
        voiceNotes = req.files[i].path;
      }
    }
  }

  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: parsed.staffId,
    reason: parsed.reason,
  };
  await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { [`radRequest.${note}.updateRecord`]: updateRecord } },
    { new: true }
  );

  const updatedrad = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`radRequest.${note}.status`]: parsed.status,
        [`radRequest.${note}.delayedReason`]: parsed.delayedReason,
        [`radRequest.${note}.activeTime`]: parsed.activeTime,
        [`radRequest.${note}.completeTime`]: parsed.completeTime,
        [`radRequest.${note}.holdTime`]: parsed.completeTime,
        [`radRequest.${note}.voiceNotes`]: voiceNotes,
        [`radRequest.${note}.image`]: arr,
      },
    },
    { new: true }
  ).populate('radRequest.serviceId');
  res.status(200).json({
    success: true,
    data: updatedrad,
  });
});

exports.searchPendingRadRequest = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    radRequest: { $ne: [] },
    'radRequest.status': 'pending',
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

exports.searchComletedRadRequest = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    radRequest: { $ne: [] },
    'radRequest.status': 'completed',
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

exports.assignHouseKeeper = asyncHandler(async (req, res, next) => {
  const {
    staffId,
    houseKeeperId,
    productionAreaId,
    roomId,
    status,
    task,
  } = req.body;
  const assignedHK = await HK.create({
    assignedBy: staffId,
    houseKeeperId,
    productionAreaId,
    roomId,
    status,
    task,
    assignedTime: Date.now(),
  });
  res.status(200).json({
    success: true,
    data: assignedHK,
  });
});
