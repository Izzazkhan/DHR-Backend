const requestNoFormat = require('dateformat');
const moment = require('moment');
const ChiefComplaint = require('../models/chiefComplaint/chiefComplaint');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');

exports.addChiefComplaint = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const { name } = req.body;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const chiefComplaintId = 'CC' + day + requestNoFormat(new Date(), 'yyHHMMss');
  const chiefComplaint = await ChiefComplaint.create({
    name,
    chiefComplaintId,
  });

  res.status(201).json({
    success: true,
    data: chiefComplaint,
  });
});

exports.getAllchiefComplaints = asyncHandler(async (req, res, next) => {
  const chiefComplaits = await ChiefComplaint.paginate({}, { limit: 100 });
  res.status(200).json({
    success: true,
    data: chiefComplaits,
  });
});

exports.getChiefComplaintByKeyword = asyncHandler(async (req, res, next) => {
  const chiefComplaint = await ChiefComplaint.aggregate([
    {
      $match: {
        $or: [
          {
            name: { $regex: req.params.keyword, $options: 'i' },
          },
          {
            chiefComplaintId: { $regex: req.params.keyword, $options: 'i' },
          },
        ],
      },
    },
  ]).limit(50);

  res.status(200).json({
    success: true,
    data: chiefComplaint,
  });
});

exports.disaleChiefComplaint = asyncHandler(async (req, res) => {
  console.log(req.body);
  const chiefComplaint = await ChiefComplaint.findOne({ _id: req.params.id });
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
    await ChiefComplaint.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord },
      }
    );
    res.status(200).json({
      success: true,
      data: 'ChiefComplaint status changed to disable',
    });
  }
});

exports.enableChiefComplaint = asyncHandler(async (req, res) => {
  const chiefComplaint = await ChiefComplaint.findOne({ _id: req.params.id });
  if (chiefComplaint.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await ChiefComplaint.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
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

exports.getDoctorsWithCC = asyncHandler(async (req, res, next) => {
  const doctors = await Staff.find({
    staffType: 'Doctor',
    chiefComplaint: { $ne: [] },
  }).populate('chiefComplaint.chiefComplaintId', 'name');

  res.status(200).json({
    success: true,
    data: doctors,
  });
});

exports.filterChiefCompaints = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const { year, availability, shift } = req.body;
  // let shift1 = Date.now(9);
  const time = moment.utc().format();
  console.log(time);

  const doctors = await Staff.find({
    'experience.ecperience': year,
    availability: availability,
    startTime: { $gte: shift },
  });
  res.status(200).json({
    success: true,
    data: doctors,
  });
});

exports.assignCC = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const doctor = await Staff.findOne({ _id: req.body.staffId });
  if (!doctor || doctor.disabled === true) {
    return next(
      new ErrorResponse('Could not assign Chief Complaint to this doctor', 400)
    );
  }
  const chiefComplaint = {
    assignedBy: req.body.assignedBy,
    chiefComplaintId: req.body.chiefComplaintId,
    assignedTime: Date.now(),
  };
  const assignedCC = await Staff.findOneAndUpdate(
    { _id: doctor.id },
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

exports.getCCDoctorByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const doctorCC = await Staff.find({ staffType: 'Doctor' }).populate(
    'chiefComplaint.chiefComplaintId'
  );
  console.log(doctorCC[0].chiefComplaint[0].chiefComplaintId.name);

  for (let i = 0; i < doctorCC.length; i++) {
    if (
      (doctorCC[i].name[0].given[0] &&
        doctorCC[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (doctorCC[i].name[0].family &&
        doctorCC[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (doctorCC[i].chiefComplaint[0].chiefComplaintId.name &&
        doctorCC[i].chiefComplaint[0].chiefComplaintId.name
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(doctorCC[i]);
    }
  }
  // console.log(arr);
  res.status(200).json({
    success: true,
    data: arr,
  });
});
