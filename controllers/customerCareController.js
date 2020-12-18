const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');

exports.getAllCustomerCares = asyncHandler(async (req, res, next) => {
  const customerCares = await Staff.find({ staffType: 'Customer Care' });
  res.status(201).json({
    success: true,
    data: customerCares,
  });
});

exports.assignCC = asyncHandler(async (req, res, next) => {
  //   console.log(req.body);
  const customerCareStaff = await Staff.findOne({ _id: req.body.staffId });
  if (!customerCareStaff || customerCareStaff.disabled === true) {
    return next(
      new ErrorResponse('Could not assign Chief Complaint to this doctor', 400)
    );
  }
  const customerCare = {
    assignedBy: req.body.assignedBy,
    customerCareId: req.body.staffId,
    assignedTime: Date.now(),
    reason: req.body.reason,
  };
  const assignedCC = await EDR.findOneAndUpdate(
    { _id: req.body.patientId },
    { $push: { customerCare }, $set: { availability: false } },
    {
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});

exports.searchCustomerCare = asyncHandler(async (req, res, next) => {
  const customerCare = await Staff.aggregate([
    {
      $match: {
        staffType: 'Customer Care',
        disabled: false,
        $or: [
          {
            'name.given': { $regex: req.params.keyword, $options: 'i' },
          },
          {
            'name.family': { $regex: req.params.keyword, $options: 'i' },
          },
          {
            'identifier.value': { $regex: req.params.keyword, $options: 'i' },
          },
        ],
      },
    },
  ]).limit(50);
  if (!customerCare) {
    return next(new ErrorResponse('No Data Found With this keyword', 404));
  }

  res.status(200).json({
    success: true,
    data: customerCare,
  });
});
