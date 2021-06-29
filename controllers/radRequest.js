const requestNoFormat = require('dateformat');
const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const HK = require('../models/houseKeepingRequest');
const asyncHandler = require('../middleware/async');
const Notification = require('../components/notification');
const Room = require('../models/room');
const PA = require('../models/productionArea');
const Flag = require('../models/flag/Flag');
const searchEdrPatient = require('../components/searchEdr');
const generateReqNo = require('../components/requestNoGenerator');
const CronFlag = require('../models/CronFlag');
s;

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

    const pendingRad = await EDR.aggregate([
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
    if (pendingRad.length > 6) {
      await Flag.create({
        edrId: parsed.edrId,
        generatedFrom: 'Rad Doctor',
        card: '1st',
        generatedFor: ['ED Doctor', ' Head Of Radiology Department'],
        reason: 'Too Many Rad Notes Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'Rad Doctor',
        status: 'pending',
      });
      globalVariable.io.emit('radDoctorPending', flags);
    }

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
      await CronFlag.findOneAndUpdate(
        { requestId: parsed.radId },
        { $set: { status: 'completed' } },
        { new: true }
      );
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
          generatedFor: ['Sensei', 'Head Of Radiology Department'],
          reason: 'Too Many Rad Results Pending',
          createdAt: Date.now(),
        });
        const flags = await Flag.find({
          generatedFrom: 'Imaging Technician',
          status: 'pending',
        });
        globalVariable.io.emit('pendingRad', flags);
      }

      if (rads.length > 6) {
        await Flag.create({
          edrId: parsed.edrId,
          generatedFrom: 'ED Nurse',
          card: '4th',
          generatedFor: ['Sensei', 'Rad Doctor'],
          reason: 'Patients Rad Consultation Notes Pending',
          createdAt: Date.now(),
        });
        const flags = await Flag.find({
          generatedFrom: 'ED Nurse',
          status: 'pending',
        });
        globalVariable.io.emit('edNursePending', flags);
      }

      if (rads.length > 6) {
        await Flag.create({
          edrId: parsed.edrId,
          generatedFrom: 'Sensei',
          card: '4th',
          generatedFor: ['Sensei', 'Rad Doctor'],
          reason: 'Patients Rad Consultation Notes Pending',
          createdAt: Date.now(),
        });
        const flags = await Flag.find({
          generatedFrom: 'Sensei',
          status: 'pending',
        });
        globalVariable.io.emit('senseiPending', flags);
      }
      Notification(
        'Report Uploaded' + parsed.radId,
        'Radiology Test Report Generated',
        'Doctor',
        'Imaging Technicians',
        '/dashboard/home/radiologyReports',
        parsed.edrId,
        '',
        'ED Doctor'
      );

      Notification(
        'Report Uploaded' + parsed.radId,
        'Radiology Report Generated',
        'Nurses',
        'Radiologist',
        '/dashboard/home/patientmanagement/viewrequests/rad/viewrad',
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
  const patients = await EDR.find({
    radRequest: { $ne: [] },
    'radRequest.status': 'pending',
  }).populate('patientId');

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchCompletedRadRequest = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    radRequest: { $ne: [] },
    'radRequest.status': 'completed',
  }).populate('patientId');

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.assignHouseKeeper = asyncHandler(async (req, res, next) => {
  const requestNo = generateReqNo('HKID');

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

exports.searchCompletedRadEdr = asyncHandler(async (req, res, next) => {
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
        'radRequest._id': mongoose.Types.ObjectId(req.params.radId),
      },
    },
  ]);

  const patients = await EDR.populate(unwindEdr, [
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
    data: patients,
  });
});
