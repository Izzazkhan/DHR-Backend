const requestNoFormat = require('dateformat');
const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const HK = require('../models/houseKeepingRequest');
const asyncHandler = require('../middleware/async');
const Notification = require('../components/notification');
const Room = require('../models/room');
const PA = require('../models/productionArea');
const Flag = require('../models/flag/Flag');

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
        $and: [
          {
            'radRequest.imageTechnicianId': mongoose.Types.ObjectId(
              req.params.radTechnicianId
            ),
          },
          {
            $or: [
              { 'radRequest.status': 'pending' },
              { 'radRequest.status': 'active' },
              { 'radRequest.status': 'hold' },
            ],
          },
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
        $and: [
          {
            'radRequest.imageTechnicianId': mongoose.Types.ObjectId(
              req.params.radTechnicianId
            ),
          },
          {
            $or: [
              { 'radRequest.status': 'completed' },
              { 'radRequest.status': 'pending approval' },
            ],
          },
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
  // console.log(req.files);
  const parsed = JSON.parse(req.body.data);

  const rad = await EDR.findOne({ _id: parsed.edrId });
  let note;
  for (let i = 0; i < rad.radRequest.length; i++) {
    if (rad.radRequest[i]._id == parsed.radId) {
      note = i;
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

  if (parsed.staffType === 'Doctor') {
    const updatedrad = await EDR.findOneAndUpdate(
      { _id: parsed.edrId },
      {
        $set: {
          [`radRequest.${note}.status`]: parsed.status,
          [`radRequest.${note}.completeTime`]: parsed.completeTime,
          [`radRequest.${note}.voiceNotes`]: req.files[0].path,
          [`radRequest.${note}.completedBy`]: parsed.completedBy,
        },
      },
      { new: true }
    ).populate('radRequest.serviceId');

    res.status(200).json({
      success: true,
      data: updatedrad,
    });
  } else {
    const arr = [];
    if (req.files) {
      for (let i = 0; i < req.files.length; i++) {
        arr.push(req.files[i].path);
      }
    }

    const updatedrad = await EDR.findOneAndUpdate(
      { _id: parsed.edrId },
      {
        $set: {
          [`radRequest.${note}.status`]: parsed.status,
          [`radRequest.${note}.delayedReason`]: parsed.delayedReason,
          [`radRequest.${note}.activeTime`]: parsed.activeTime,
          [`radRequest.${note}.imageTechnicianId`]: parsed.imageTechnicianId,
          [`radRequest.${note}.pendingApprovalTime`]: parsed.pendingApprovalTime,
          [`radRequest.${note}.holdTime`]: parsed.holdTime,
          [`radRequest.${note}.image`]: arr,
        },
      },
      { new: true }
    ).populate('radRequest.serviceId');

    if (parsed.status === 'pending approval') {
      // Finding Pending Rads for Flag
      const rads = await EDR.aggregate([
        {
          $project: {
            radRequest: 1,
          },
        },
        {
          $unwind: '$radRequest',
        },
        {
          $match: {
            'radRequest.status': 'pending approval',
          },
        },
      ]);

      // Rasing Flag
      if (rads.length > 6) {
        await Flag.create({
          edrId: parsed.edrId,
          generatedFrom: 'Imaging Technician',
          card: '2nd',
          generatedFor: 'Sensei',
          reason: 'Too Many Rad Results Pending',
          createdAt: Date.now(),
        });
        const flags = await Flag.find({
          generatedFrom: 'Imaging Technician',
          $or: [{ status: 'pending' }, { status: 'in_progress' }],
          // card: '1st',
        });
        globalVariable.io.emit('pendingRad', flags);
      }
      Notification(
        'Report Uploaded',
        'Radiology Test Report Generated',
        'Doctor',
        'Imaging Technicians',
        '/dashboard/home/radiologyTasks',
        parsed.edrId,
        '',
        'ED Doctor'
      );

      Notification(
        'Report Uploaded',
        'Radiology Report Generated',
        'Nurses',
        'Radiologist',
        '/dashboard/home/notes',
        parsed.edrId,
        '',
        'ED Nurse'
      );
    }

    res.status(200).json({
      success: true,
      data: updatedrad,
    });
  }
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
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const requestNo = 'HKID' + day + requestNoFormat(new Date(), 'yyHHMMss');

  const {
    staffId,
    requestedBy,
    houseKeeperId,
    productionAreaId,
    roomId,
    status,
    task,
  } = req.body;
  const assignedHK = await HK.create({
    requestNo,
    assignedBy: staffId,
    requestedBy,
    houseKeeperId,
    productionAreaId,
    roomId,
    status,
    task,
    assignedTime: Date.now(),
  });
  const productionArea = await PA.findById(productionAreaId);
  const room = await Room.findById(roomId);
  Notification(
    'Clean Room',
    'Clean Imaging Room' + productionArea.paName + room.roomNo,
    'House Keeping',
    'Imaging Technicians',
    '/dashboard/home/housekeepingrequests',
    '',
    '',
    '',
    ''
  );
  res.status(200).json({
    success: true,
    data: assignedHK,
  });
});

exports.getPendingRadEdrForED = asyncHandler(async (req, res, next) => {
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
        $and: [
          {
            'radRequest.imageTechnicianId': mongoose.Types.ObjectId(
              req.params.radTechnicianId
            ),
          },
          {
            'radRequest.status': 'pending approval',
          },
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

exports.getCompletedRadEdrForED = asyncHandler(async (req, res, next) => {
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
        $and: [
          {
            'radRequest.imageTechnicianId': mongoose.Types.ObjectId(
              req.params.radTechnicianId
            ),
          },
          {
            'radRequest.status': 'completed',
          },
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
