const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const EDR = require('../models/EDR/EDR');
const PA = require('../models/productionArea');
// const ErrorResponse = require('../utils/errorResponse');

exports.updateStaffShift = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findOne({ _id: req.body.staffId });
  if (staff.availability === false) {
    res
      .status(200)
      .json({ success: false, data: 'Staff already assigned to Visit' });
  } else if (staff.disabled === true) {
    res.status(200).json({ success: false, data: 'Staff disabled' });
  } else {
    console.log(req.body);
    const chiefComplaint = {
      assignedBy: req.body.assignedBy,
      chiefComplaintId: req.body.chiefComplaint,
      assignedTime: Date.now(),
    };
    let updatedStaff;
    updatedStaff = await Staff.findOneAndUpdate(
      { _id: staff.id },
      { $push: { chiefComplaint } },
      {
        new: true,
      }
    );
    const productionArea = {
      assignedBy: req.body.assignedBy,
      productionAreaId: req.body.productionAreaName,
      assignedTime: Date.now(),
    };
    updatedStaff = await Staff.findOneAndUpdate(
      { _id: staff.id },
      { $push: { productionArea } },
      {
        new: true,
      }
    );
    updatedStaff = await Staff.findOneAndUpdate(
      { _id: staff.id },
      {
        $set: {
          shift: req.body.shift,
          shiftStartTime: req.body.shiftStartTime,
          shiftEndTime: req.body.shiftEndTime,
        },
      },
      {
        new: true,
      }
    );
    const updateRecord = {
      updatetAt: Date.now(),
      updatedBy: req.body.assignedBy,
      reason: req.body.reason,
    };

    updatedStaff = await Staff.findOneAndUpdate(
      { _id: staff.id },
      {
        $push: { updateRecord },
      },
      {
        new: true,
      }
    );

    // updatedStaff = await Staff.find({ _id: staff.id }).populate(
    //   'productionArea.productionAreaId'
    // );
    // console.log(updatedStaff);
    res.status(200).json({
      success: true,
      data: updatedStaff,
    });
  }
});

exports.getCCPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    chiefComplaint: { $ne: [] },
  }).populate('patientId chiefComplaint.chiefComplaintId');
  // console.log(patients[0].chiefComplaint[0].chiefComplaintId._id);
  // for (let i = 0; i < patients.length; i++) {
  //   const latestCC = patients[i].chiefComplaint.length - 1;
  //   // console.log(latestCC);
  // }
  // const prodAreas = await PA.find({
  //   'chiefComplaint.chiefComplaintId':
  //     patients[i].chiefComplaint[latestCC].chiefComplaintId._id,
  // });
  // console.log(prodAreas);
  // res.status(200).json({
  //   success: true,
  //   data: patients,
  // });
});
