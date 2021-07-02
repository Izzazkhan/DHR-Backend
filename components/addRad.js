const asyncHandler = require('../middleware/async');
const Staff = require('../models/staffFhir/staff');
const Notification = require('./notification');
const Flag = require('../models/flag/Flag');
const generateReqNo = require('./requestNoGenerator');
const EDR = require('../models/EDR/EDR');

const addRadRequest = asyncHandler(async (data) => {
  const currentStaff = await Staff.findById(data.staffId).select('shift');

  const radTechnicians = await Staff.find({
    staffType: 'Imaging Technician',
    disabled: false,
    shift: currentStaff.shift,
  }).select('identifier name');

  const random = Math.floor(Math.random() * (radTechnicians.length - 1));
  const radTechnician = radTechnicians[random];
  const requestId = generateReqNo('RR');

  const radRequest = {
    requestId,
    name: data.name,
    serviceId: data.serviceId,
    type: data.type,
    price: data.price,
    status: data.status,
  };

  const newRad = await EDR.findOneAndUpdate(
    { _id: data.edrId },
    { $push: { radRequest } },
    { new: true }
  );

  const assignedRad = await EDR.findOneAndUpdate(
    {
      _id: data.edrId,
      'radRequest._id': newRad.radRequest[newRad.radRequest.length - 1]._id,
    },
    {
      $set: {
        'radRequest.$.priority': data.priority,
        'radRequest.$.requestedBy': data.staffId,
        'radRequest.$.requestedAt': Date.now(),
        'radRequest.$.imageTechnicianId': radTechnician._id,
        'radRequest.$.reason': data.reason,
        'radRequest.$.notes': data.notes,
        'radRequest.$.reqFromCareStream': true,
        'labRequest.$.careStreamId': data.careStreamId,
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
      edrId: data.edrId,
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
    data.edrId,
    ''
  );

  Notification(
    'Rad Request',
    'Rad Request',
    'Admin',
    'Rad Request',
    '/dashboard/home/radiologyTasks',
    data.edrId,
    ''
  );
});

module.exports = addRadRequest;
