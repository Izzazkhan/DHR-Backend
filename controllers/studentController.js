const asyncHandler = require('../middleware/async');
const Student = require('../models/student/student');
const ErrorResponse = require('../utils/errorResponse');

exports.addStudent = asyncHandler(async (req, res) => {
  const { name, gender, age } = req.body;

  const student = await Student.create({
    name: name,
    gender: gender,
    age: age,
  });

  res.status(200).json({ success: true, data: student });
});

exports.getStudent = asyncHandler(async (req, res) => {
  const student = await Student.find();

  const data = {
    student,
  };

  res.status(200).json({ success: true, data: data });
});

exports.updateStudent = asyncHandler(async (req, res, next) => {
  const { _id } = req.body;

  let student = await Student.findById(_id);
  if (!student) {
    return next(new ErrorResponse(`Vendor not found with id of ${_id}`, 404));
  }
  student = await Student.updateOne({ _id: _id }, req.body);

  //   let student = await Student.findOneAndUpdate({ _id: _id }, req.body);

  res.status(200).json({ success: true, data: student });
});

exports.deleteStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const student = await Student.findOne({ _id: req.params.id });
  // const { _id } = req.body;
  // const product = await Product.findById(_id);
  // if (!product) {
  //   return next(new ErrorResponse(`product not found with id of ${_id}`, 404));
  // }

  await Student.deleteOne({ _id: id });

  res.status(200).json({ success: true, data: {} });
});
