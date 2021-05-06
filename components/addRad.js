const asyncHandler = require('../middleware/async');
const Staff = require('../models/staffFhir/staff');
const Notification = require('./notification');
const Flag = require('../models/flag/Flag');
const generateReqNo = require('./requestNoGenerator');
const EDR = require('../models/EDR/EDR');

exports.addRadRequest = asyncHandler(async (req, res, next) => {
  const requestId = generateReqNo('RR');

  const radRequest = {
    requestId,
    name: req.body.name,
    serviceId: req.body.serviceId,
    type: req.body.type,
    price: req.body.price,
    status: req.body.status,
  };

  const newRad = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { radRequest } },
    { new: true }
  );

  const assignedRad = await EDR.findOneAndUpdate(
    {
      _id: req.body.edrId,
      'radRequest._id': newRad.radRequest[newRad.radRequest.length - 1]._id,
    },
    {
      $set: {
        'radRequest.$.priority': req.body.priority,
        'radRequest.$.requestedBy': req.body.staffId,
        'radRequest.$.requestedAt': Date.now(),
        'radRequest.$.imageTechnicianId': req.body.radTechnicianId,
        'radRequest.$.reason': req.body.reason,
        'radRequest.$.notes': req.body.notes,
      },
    },
    { new: true }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  // Finding Pending Rads for Flag
  const rads = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $or: [
          { 'radRequest.status': 'pending' },
          { 'radRequest.status': 'active' },
          { 'radRequest.status': 'hold' },
        ],
      },
    },
  ]);

  // Rasing Flag
  if (rads.length > 6) {
    await Flag.create({
      edrId: req.body.edrId,
      generatedFrom: 'Imaging Technician',
      card: '1st',
      generatedFor: ['Sensei', 'Head Of Radiology Department'],
      reason: 'Too Many Rad Tests Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Imaging Technician',
      status: 'pending',
      // card: '1st',
    });

    globalVariable.io.emit('pendingRad', flags);
  }

  // Notification
  Notification(
    'Rad Test',
    'Imaging Test Requests',
    'Imaging Technician',
    'ED Doctor',
    '/dashboard/home/radiologyTasks',
    req.body.edrId,
    ''
  );

  Notification(
    'Rad Request',
    'Rad Request',
    'Admin',
    'Rad Request',
    '/dashboard/home/radiologyTasks',
    req.body.edrId,
    ''
  );

  res.status(200).json({
    success: true,
    data: assignedRad,
  });
});
