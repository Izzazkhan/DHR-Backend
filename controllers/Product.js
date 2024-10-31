const asyncHandler = require('../middleware/async');
const Product = require('../models/product/product');
const ErrorResponse = require('../utils/errorResponse');

exports.addProduct = asyncHandler(async (req, res) => {
  const { name, type } = req.body;

  const product = await Product.create({
    name: name,
    type: type,
  });

  res.status(200).json({ success: true, data: product });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.find();

  const data = {
    product,
  };

  res.status(200).json({ success: true, data: data });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  const { _id } = req.body;

  // let product = await Product.findById(_id);
  // if (!product) {
  //   return next(new ErrorResponse(`Vendor not found with id of ${_id}`, 404));
  // }
  // product = await Product.updateOne({ _id: _id }, req.body);

  let product = await Product.findOneAndUpdate({ _id: _id }, req.body);

  res.status(200).json({ success: true, data: product });
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  // console.log(req.params.id);
  const { id } = req.params;
  console.log(id);
  const product = await Product.findOne({ _id: req.params.id });
  console.log(product);
  // const { _id } = req.body;
  // const product = await Product.findById(_id);
  // if (!product) {
  //   return next(new ErrorResponse(`product not found with id of ${_id}`, 404));
  // }

  await Product.deleteOne({ _id: id });

  res.status(200).json({ success: true, data: {} });
});
