const CodeBlue = require('../models/codeBlueTeam');
const asyncHandler = require('../middleware/async');
const EDR = require('../models/EDR/EDR');
const ErrorResponse = require('../utils/errorResponse');
const Notification = require('../components/notification');
const Staff = require('../models/staffFhir/staff');

exports.addCodeBlueTeam = asyncHandler(async (req, res, next) => {
  const { addedBy, teamName, edNurse, edDoctor, anesthesiologist } = req.body;

  const newTeam = await CodeBlue.create({
    createdBy: addedBy,
    teamName,
    doctors: edDoctor,
    nurses: edNurse,
    anesthesiologists: anesthesiologist,
    createdAt: Date.now(),
  });

  res.status(200).json({
    success: true,
    data: newTeam,
  });
});

exports.getCodeBlueTeam = asyncHandler(async (req, res, next) => {
  const teams = await CodeBlue.find().populate(
    'doctors nurses anesthesiologists addedBy'
  );
  res.status(200).json({
    success: true,
    data: teams,
  });
});

exports.updateCodeBlueTeam = asyncHandler(async (req, res, next) => {
  const { addedBy, teamName, edNurse, edDoctor, anesthesiologist } = req.body;
  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: req.body.updatedBy,
    reason: req.body.reason,
  };
  await CodeBlue.findByIdAndUpdate(
    req.body.teamId,
    {
      $push: {
        updateRecord,
      },
    },
    { new: true }
  );
  const updatedTeam = await CodeBlue.findByIdAndUpdate(
    req.body.teamId,
    {
      $set: {
        createdBy: addedBy,
        teamName,
        doctors: edDoctor,
        nurses: edNurse,
        anesthesiologists: anesthesiologist,
      },
    },
    { new: true }
  ).populate('doctors nurses anesthesiologists addedBy');

  res.status(200).json({
    success: true,
    data: updatedTeam,
  });
});

exports.assignCodeBlueTeam = asyncHandler(async (req, res, next) => {
  const codeBlueTeam = {
    teamId: req.body.teamId,
    assignedTime: Date.now(),
    assignedBy: req.body.assignedBy,
  };

  await CodeBlue.findOneAndUpdate(
    { _id: req.body.teamId },
    { $set: { status: 'Assigned' } },
    { new: true }
  );

  const assignedTeam = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { codeBlueTeam } },
    { new: true }
  );

  const staff = await Staff.findById(req.body.assignedBy).select(
    'staffType subType'
  );

  if (staff.staffType === 'Admin' || staff.staffType === 'Sensei') {
    Notification(
      'Code Blue Team Call',
      'Code Blue Team Called',
      'Sensei',
      'Code Blue Team',
      '/dashboard/home/codeblue',
      req.body.edrId,
      ''
    );
  }

  if (staff.staffType === 'Doctor' && staff.subType === 'ED Doctor') {
    Notification(
      'Code Blue Team Call',
      'Ed Doctor called Code Blue Team For',
      'Sensei',
      'Code Blue Team',
      '/dashboard/home/codeblue',
      req.body.edrId,
      ''
    );
  }

  if (staff.staffType === 'Nurses' && staff.subType === 'ED Nurse') {
    Notification(
      'Code Blue Team Call',
      'Ed Nurse called Code Blue Team For',
      'Sensei',
      'Code Blue Team',
      '/dashboard/home/codeblue',
      req.body.edrId,
      ''
    );
  }
  if (staff.staffType === 'Nurses' && staff.subType === 'EOU Nurse') {
    Notification(
      'Code Blue Team Call',
      'EOU Nurse called Code Blue Team For',
      'Sensei',
      'Code Blue Team',
      '/dashboard/home/codeblue',
      req.body.edrId,
      ''
    );
  }

  res.status(200).json({
    success: true,
    data: assignedTeam,
  });
});
