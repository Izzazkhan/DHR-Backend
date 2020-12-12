const requestNoFormat = require('dateformat');
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
  // const doctors = await Staff.find({
  //   $and: [{ staffType: 'Doctor' }, { chiefComplaint: { $ne: '' } }],
  // });
  const doctors = await Staff.find({
    staffType: 'Doctor',
    chiefComplaint: { $ne: '' },
  });
  // .populate('chiefComplaint')
  // .select('name');

  console.log(doctors);
});
