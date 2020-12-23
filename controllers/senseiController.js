const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');

// exports.getPharmacyRequests = asyncHandler(async (req, res, next) => {
//   const pharmacyRequests = await Pharm.find();
// });

exports.updateStaffShift = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findOne({_id:req.body.staffId})
if(staff.availability===false)
{
  res.status(200).json({success:false,data:"Staff already assigned to Visit"})
}
else if(staff.disabled===true)
{
  res.status(200).json({success:false,data:"Staff disabled"})
}
else{
  console.log(req.body)
}
});