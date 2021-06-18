const Staff = require('../models/staffFhir/staff');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const Shift = require('../models/shift');

exports.getCurrentShiftDocs = asyncHandler(async (req, res, next) => {
  const doctorPA = await Staff.findById(req.params.staffId)
    .select('chiefComplaint.chiefComplaintId shift')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
    ]);
  const latestCC = doctorPA.chiefComplaint.length - 1;

  const chiefComplaintId =
    doctorPA.chiefComplaint[latestCC].chiefComplaintId._id;

  const staff = await Staff.find({
    _id: { $ne: req.params.staffId },
    staffType: 'Doctor',
    subType: 'ED Doctor',
    shift: doctorPA.shift,
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  });

  res.status(200).json({
    success: true,
    data: staff,
  });
});

exports.getNextShiftDocs = asyncHandler(async (req, res, next) => {
  const doctorPA = await Staff.findById(req.params.staffId)
    .select('chiefComplaint.chiefComplaintId shift')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
    ]);
  const latestCC = doctorPA.chiefComplaint.length - 1;

  const chiefComplaintId =
    doctorPA.chiefComplaint[latestCC].chiefComplaintId._id;

  // Finding Next Shift Staff
  let staff;
  const currentShift = await Shift.findById(doctorPA.shift);
  console.log(currentShift);
  if (currentShift.name === 'Morning') {
    const nextShift = await Shift.findOne({ name: 'Evening' });
    staff = await Staff.find({
      _id: { $ne: req.params.staffId },
      staffType: 'Doctor',
      subType: 'ED Doctor',
      shift: nextShift._id,
      'chiefComplaint.chiefComplaintId': chiefComplaintId,
    });
  }

  if (currentShift.name === 'Evening') {
    const nextShift = await Shift.findOne({ name: 'Night' });
    staff = await Staff.find({
      _id: { $ne: req.params.staffId },
      staffType: 'Doctor',
      subType: 'ED Doctor',
      shift: nextShift._id,
      'chiefComplaint.chiefComplaintId': chiefComplaintId,
    });
  }

  if (currentShift.name === 'Night') {
    const nextShift = await Shift.findOne({ name: 'Morning' });

    staff = await Staff.find({
      _id: { $ne: req.params.staffId },
      staffType: 'Doctor',
      subType: 'ED Doctor',
      shift: nextShift._id,
      'chiefComplaint.chiefComplaintId': chiefComplaintId,
    });
  }

  res.status(200).json({
    success: true,
    data: staff,
  });
});
