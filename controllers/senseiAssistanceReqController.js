const mongoose = require('mongoose');
const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const SenseiAssistanceReq = require('../models/senseiAssistanceReq');

exports.getAssistanceRequestForNurse = asyncHandler(async (req, res, next) => {
  const assistanceRequest = await SenseiAssistanceReq.find({
    $or: [
      { assignedTo: req.params.nurseId },
      { assignedBy: req.params.nurseId },
    ],
  })
    .populate('assignedTo assignedBy edrId')
    .populate({
      path: 'edrId',
      populate: { path: 'patientId' },
    });
  res.status(201).json({
    success: true,
    data: assistanceRequest,
  });
});

exports.addAssistanceRequestForNurse = asyncHandler(async (req, res, next) => {
  const { edrId, assignedTo, assignedBy, status, reason } = req.body;
  const assistanceRequest = await SenseiAssistanceReq.create(req.body);
  res.status(201).json({
    success: true,
    data: assistanceRequest,
  });
});

exports.updateAssistanceRequestForNurse = asyncHandler(
  async (req, res, next) => {
    const { edrId, assignedTo, assignedBy, status, reason } = req.body;
    const assistanceRequest = await SenseiAssistanceReq.findOneAndUpdate(
      { _id: req.body.requestId },
      req.body,
      { new: true }
    );
    res.status(201).json({
      success: true,
      data: assistanceRequest,
    });
  }
);

exports.completeAssistanceRequestForNurse = asyncHandler(
  async (req, res, next) => {
    const assistanceRequest = await SenseiAssistanceReq.findOneAndUpdate(
      { _id: req.body.requestId },
      {
        status: 'complete',
        completionDate: Date.now(),
        nurseNotes: req.body.nurseNotes,
      },
      { new: true }
    );
    res.status(201).json({
      success: true,
      data: assistanceRequest,
    });
  }
);
