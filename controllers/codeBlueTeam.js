const CodeBlue = require('../models/codeBlueTeam');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.addCodeBlueTeam = asyncHandler(async (req, res, next) => {
  const { addedBy, teamName, edNurse, edDoctor, anesthesiologist } = req.body;

  const newTeam = await CodeBlue.create({
    createdBy: addedBy,
    teamName,
    doctors: edNurse,
    nurses: edDoctor,
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
  const updatedTeam = await CodeBlue.findByIdAndUpdate(
    req.body.teamId,
    req.body,
    { new: true }
  ).populate('doctors nurses anesthesiologists addedBy');

  res.status(200).json({
    success: true,
    data: updatedTeam,
  });
});
