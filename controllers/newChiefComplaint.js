const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const PA = require('../models/productionArea');
const EDR = require('../models/EDR/EDR');
const NewCC = require('../models/newChiefComplaint');
const Flag = require('../models/flag/Flag');
const searchStaff = require('../components/searchStaff');
const generateReqNo = require('../components/requestNoGenerator');

exports.addChiefComplaint = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  const chiefComplaintId = generateReqNo('CC');
  const chiefComplaint = await NewCC.create({
    name,
    chiefComplaintId,
  });

  res.status(201).json({
    success: true,
    data: chiefComplaint,
  });
});

exports.getAllChiefComplaints = asyncHandler(async (req, res, next) => {
  const chiefComplaints = await NewCC.find({ disabled: false });
  res.status(200).json({
    success: true,
    data: chiefComplaints,
  });
});

exports.disableChiefComplaint = asyncHandler(async (req, res) => {
  const chiefComplaint = await NewCC.findOne({ _id: req.params.id });
  if (chiefComplaint.availability === false) {
    res.status(200).json({
      success: false,
      data: 'ChiefComplaint not available for disabling',
    });
  } else if (chiefComplaint.disabled === true) {
    res
      .status(200)
      .json({ success: false, data: 'ChiefComplaint already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await NewCC.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
      },
      {
        new: true,
      }
    );
    await NewCC.findOneAndUpdate(
      { _id: req.params.id },
      {
        $push: { updateRecord },
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      data: 'ChiefComplaint status changed to disable',
    });
  }
});

exports.enableChiefComplaint = asyncHandler(async (req, res) => {
  const chiefComplaint = await NewCC.findOne({ _id: req.params.id });
  if (chiefComplaint.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await NewCC.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
      }
    );
    await NewCC.findOneAndUpdate(
      { _id: req.params.id },
      {
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'ChiefComplaint status changed to enable' });
  } else {
    res
      .status(200)
      .json({ success: false, data: 'ChiefComplaint already enabled' });
  }
});

exports.assignCC = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findOne({ _id: req.body.staffId });
  if (!staff || staff.disabled === true) {
    return next(
      new ErrorResponse('Could not assign Chief Complaint to this staff', 400)
    );
  }
  const chiefComplaintId = await NewCC.findOne({
    'productionArea.productionAreaId': req.body.productionAreaId,
  });
  // console.log(chiefComplaintId._id);
  const chiefComplaint = {
    assignedBy: req.body.assignedBy,
    chiefComplaintId: chiefComplaintId._id,
    assignedTime: Date.now(),
  };
  const assignedCC = await Staff.findOneAndUpdate(
    { _id: staff.id },
    { $push: { chiefComplaint } },
    {
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});

exports.assignCCtoPatient = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  const chiefComplaint = {
    assignedBy: parsed.assignedBy,
    newChiefComplaintId: parsed.chiefComplaint,
    assignedTime: Date.now(),
    reason: parsed.reason,
    voiceNotes: req.file ? req.file.path : null,
    comments: parsed.comments,
  };

  // Assigning Chief Complaint
  const assignedCC = await EDR.findOneAndUpdate(
    { _id: parsed.patientid },
    { $push: { newChiefComplaint: chiefComplaint } },
    {
      new: true,
    }
  );

  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});
