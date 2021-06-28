/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EOU = require('../models/EOU');
const Bed = require('../models/Bed');
const EDR = require('../models/EDR/EDR');
const EOUNurse = require('../models/EOUNurse');
const TransferToEOU = require('../models/patientTransferEDEOU/patientTransferEDEOU');
const Notification = require('../components/notification');
const Staff = require('../models/staffFhir/staff');

exports.createEOU = asyncHandler(async (req, res, next) => {
  const newEou = await EOU.create(req.body);

  res.status(201).json({
    success: true,
    data: newEou,
  });
});

exports.assignBedToEOU = asyncHandler(async (req, res, next) => {
  const { staffId, eouBeds } = req.body;

  const beds = [];
  for (let i = 0; i < eouBeds.length; i++) {
    const eouBed = await Bed.findOne({ _id: eouBeds[i] });

    if (!eouBed || eouBed.availability === false || eouBed.disabled === true) {
      return next(
        new ErrorResponse('This bed could not be assigned to EOU', 400)
      );
    }

    const bed = {
      bedIdDB: eouBed._id,
      bedId: eouBed.bedId,
      bedNo: eouBed.bedNo,
      availability: true,
      assignedBy: staffId,
      disabled: false,
    };

    beds.push(bed);

    await Bed.findOneAndUpdate(
      { _id: eouBed._id },
      { $set: { availability: false, bedType: 'EOU' } },
      { new: true }
    );
  }

  const assignedBeds = await EOU.findOneAndUpdate(
    { name: 'EOU' },
    { $push: { beds } },
    { $new: true }
  );

  res.status(200).json({
    success: true,
    data: assignedBeds,
  });
});

exports.removeBedFromEOU = asyncHandler(async (req, res, next) => {
  const { staffId, bedId, reason } = req.body;

  const bed = await Bed.findById(bedId);

  if (!bed || bed.disabled === true) {
    return res.status(200).json({
      success: false,
      data: 'This bed is not available',
    });
  }

  const eouBed = await EOU.aggregate([
    {
      $unwind: '$beds',
    },
    {
      $match: {
        'beds.bedIdDB': mongoose.Types.ObjectId(bedId),
      },
    },
  ]);

  if (eouBed[0].beds.availability === false) {
    return res.status(200).json({
      success: false,
      data: 'This bed is not available to move',
    });
  }

  const assignedBeds = await EOU.findOneAndUpdate(
    { name: 'EOU' },
    { $pull: { beds: { bedIdDB: bedId } } },
    { $new: true }
  );

  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: staffId,
    reason: reason,
  };

  await EOU.findOneAndUpdate(
    { name: 'EOU' },
    { $push: { updateRecord } },
    { $new: true }
  );

  await Bed.findOneAndUpdate(
    { _id: bedId },
    { $set: { availability: true, bedType: '' } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: assignedBeds,
  });
});

exports.getAllBeds = asyncHandler(async (req, res, next) => {
  const beds = await EOU.find().select('beds');

  res.status(200).json({
    success: true,
    data: beds,
  });
});

exports.getAvailableBeds = asyncHandler(async (req, res, next) => {
  const beds = await EOU.aggregate([
    {
      $project: {
        beds: 1,
      },
    },
    {
      $unwind: '$beds',
    },
    {
      $match: {
        'beds.availability': true,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: beds,
  });
});

exports.pendingNurseAssign = asyncHandler(async (req, res, next) => {
  const edrs = await TransferToEOU.find({
    status: 'completed',
    eouNurseAssigned: false,
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier name',
        },
        {
          path: 'room.roomId',
          model: 'room',
          select: 'roomNo ',
        },
        {
          path: 'chiefComplaint.chiefComplaintId',
          model: 'chiefComplaint',
          select: 'productionArea.productionAreaId',
          populate: {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        },
        {
          path: 'newChiefComplaint.newChiefComplaintId',
          model: 'NewChiefComplaint',
        },
        {
          path: 'eouBed.bedId',
          model: 'Bed',
          select: 'bedId bedNo',
        },
      ],
    },
  ]);

  res.status(200).json({
    success: true,
    data: edrs,
  });
});

exports.assignBedTONurse = asyncHandler(async (req, res, next) => {
  const { nurseId, bedNo, bedId, edrId, assignedBy, transferId } = req.body;
  const assignedBed = await EOUNurse.create({
    nurseId,
    bedNo,
    bedId,
    edrId,
    assignedBy,
    assignedAt: Date.now(),
  });

  await TransferToEOU.findOneAndUpdate(
    { _id: transferId },
    { $set: { eouNurseAssigned: true, eouNurseId: nurseId } },
    { new: true }
  );

  Notification(
    'ADT_A04',
    'Bed Allocation from Sensei',
    '',
    'Transfer To EOU',
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    '',
    nurseId
  );

  res.status(200).json({
    success: true,
    data: assignedBed,
  });
});

exports.completedNurseAssign = asyncHandler(async (req, res, next) => {
  const edrs = await TransferToEOU.find({
    status: 'completed',
    eouNurseAssigned: true,
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier name',
        },
        {
          path: 'room.roomId',
          model: 'room',
          select: 'roomNo ',
        },
        {
          path: 'chiefComplaint.chiefComplaintId',
          model: 'chiefComplaint',
          select: 'productionArea.productionAreaId',
          populate: {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        },
        {
          path: 'newChiefComplaint.newChiefComplaintId',
          model: 'NewChiefComplaint',
        },
        {
          path: 'eouBed.bedId',
          model: 'Bed',
          select: 'bedId bedNo',
        },
      ],
    },
    {
      path: 'eouNurseId',
      select: 'identifier name',
    },
  ]);

  res.status(200).json({
    success: true,
    data: edrs,
  });
});

exports.sendNotification = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findById(req.body.edrId).select('chiefComplaint');
  const latestCC = edr.chiefComplaint.length - 1;
  const chiefComplaintId = edr.chiefComplaint[latestCC].chiefComplaintId._id;

  const nurseShift = await Staff.find(req.body.staffId).select('shift');

  const doctors = await Staff.find({
    staffType: 'Doctor',
    subType: 'ED Doctor',
    shift: nurseShift.shift,
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  });

  doctors.forEach((doctor) => {
    Notification(
      'EOU Nurse Call',
      'EOU Nurse Call',
      '',
      'EOU Nurse Call',
      '/dashboard/home/notes',
      req.body.edrId,
      '',
      '',
      doctor._id
    );
  });
});
