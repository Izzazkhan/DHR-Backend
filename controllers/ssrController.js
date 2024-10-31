const SSR = require('../models/SSR/SSR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Student = require('../models/student/student');

exports.generateSSR = asyncHandler(async (req, res, next) => {
  let newSSR;
  const { studentId } = req.body;
  console.log(studentId);

  newSSR = await SSR.create({
    studentId,
  });
  console.log(newSSR);

  //   await SSR.findOneAndUpdate(
  //     { _id: newSSR._id },
  //     {
  //       $set: {
  //         dcdForm: dcdFormVersion,
  //         generatedFrom: generatedFrom,
  //         patientInHospital: patientInHospital,
  //         createdTimeStamp: Date.now(),
  //       },
  //     }
  //   );
  //   await SSR.findOneAndUpdate(
  //     { _id: newSSR._id },
  //     {
  //       $set: {
  //         paymentMethod: paymentMethod,
  //       },
  //     }
  //   );
  newSSR = await SSR.findOne({ _id: newSSR._id });

  res.status(201).json({
    success: true,
    data: newSSR,
  });
});

exports.getSSRById = asyncHandler(async (req, res, next) => {
  const ssr = await SSR.findById(
    { _id: req.params.id }
    //   { dcdForm: { $slice: -1 } }
  ).populate('studentId');
  if (!ssr) {
    return next(new ErrorResponse('No SSR found for this student', 404));
  }

  res.status(200).json({
    success: true,
    data: ssr,
  });
});

exports.getSSRs = asyncHandler(async (req, res, next) => {
  const SSRs = await SSR.find().populate('studentId');
  res.status(201).json({
    success: true,
    data: SSRs,
  });
});
