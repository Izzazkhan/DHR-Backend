const Staff = require('../models/staffFhir/staff');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');

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
