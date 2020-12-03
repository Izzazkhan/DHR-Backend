const Pharm = require('../models/requests/pharm');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.getPharmacyRequests = asyncHandler(async (req, res, next) => {
  const pharmacyRequests = await Pharm.find();
  console.log(pharmacyRequests);
});
