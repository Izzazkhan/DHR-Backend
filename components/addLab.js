const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
const Staff = require('../models/staffFhir/staff');
const Notification = require('./notification');
const Flag = require('../models/flag/Flag');
const generateReqNo = require('./requestNoGenerator');
const EDR = require('../models/EDR/EDR');

const addLabRequest = asyncHandler(async (data) => {
  // Sample Collection Task
  const currentStaff = await Staff.findById(data.staffId).select('shift');

  const nurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'Nurse Technician',
    disabled: false,
    shift: currentStaff.shift,
  }).select('identifier name');

  const random = Math.floor(Math.random() * (nurses.length - 1));
  const nurseTechnician = nurses[random];

  const labTechnicians = await Staff.find({
    staffType: 'Lab Technician',
    disabled: false,
    shift: currentStaff.shift,
  }).select('identifier name');

  const randomLab = Math.floor(Math.random() * (labTechnicians.length - 1));
  const labTechnician = labTechnicians[randomLab];
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  const requestId = generateReqNo('LR')`${'LR'}${day}${requestNoFormat(
    new Date(),
    'yyHHMMssL'
  )}`;

  const labRequest = {
    requestId,
    name: data.name,
    serviceId: data.serviceId,
    type: data.type,
    price: data.price,
    status: data.status,
  };

  const newLab = await EDR.findOneAndUpdate(
    { _id: data.edrId },
    { $push: { labRequest } },
    { new: true }
  );

  const assignedLab = await EDR.findOneAndUpdate(
    {
      _id: data.edrId,
      'labRequest._id': newLab.labRequest[newLab.labRequest.length - 1]._id,
    },
    {
      $set: {
        'labRequest.$.priority': data.priority,
        'labRequest.$.requestedBy': data.staffId,
        'labRequest.$.requestedAt': Date.now(),
        'labRequest.$.assignedTo': nurseTechnician._id,
        'labRequest.$.labTechnicianId': labTechnician._id,
        'labRequest.$.reason': data.reason,
        'labRequest.$.notes': data.notes,
        'labRequest.$.reqFromCareStream': true,
        'labRequest.$.careStreamId': data.careStreamId,
        'labRequest.$.labTestId': data.labTestId,
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

  // Checking for flag
  const labPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [{ 'labRequest.status': { $ne: 'completed' } }],
      },
    },
  ]);

  if (labPending.length > 5) {
    await Flag.create({
      edrId: data.edrId,
      generatedFrom: 'Sensei',
      card: '5th',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Too Many Lab Results Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Sensei',
      status: 'pending',
    });
    globalVariable.io.emit('pendingSensei', flags);
  }

  if (labPending.length > 5) {
    await Flag.create({
      edrId: data.edrId,
      generatedFrom: 'Lab Technician',
      card: '2nd',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Too Many Lab Results Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Lab Technician',
      status: 'pending',
    });
    globalVariable.io.emit('ltPending', flags);
  }

  if (labPending.length > 6) {
    await Flag.create({
      edrId: data.edrId,
      generatedFrom: 'ED Nurse',
      card: '6th',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Lab Results Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'ED Nurse',
      status: 'pending',
    });
    globalVariable.io.emit('edNursePending', flags);
  }

  // Lab Technician Flags
  const samplePending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.type': { $ne: 'Blood' } },
          { 'labRequest.nurseTechnicianStatus': 'Not Collected' },
        ],
      },
    },
  ]);
  if (samplePending.length > 6) {
    await Flag.create({
      edrId: data.edrId,
      generatedFrom: 'Lab Technician',
      card: '1st',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Sample Collection Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Lab Technician',
      status: 'pending',
    });
    globalVariable.io.emit('ltPending', flags);
  }

  const bloodPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.type': 'Blood' },
          { 'labRequest.nurseTechnicianStatus': 'Not Collected' },
        ],
      },
    },
  ]);

  if (bloodPending.length > 10) {
    await Flag.create({
      edrId: data.edrId,
      generatedFrom: 'Lab Technician',
      card: '3rd',
      generatedFor: ['Lab Supervisor'],
      reason: 'Blood Sample Collection Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Lab Technician',
      status: 'pending',
    });
    globalVariable.io.emit('ltPending', flags);
  }

  const resultsPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': { $ne: 'completed' } },
          { 'labRequest.type': 'Blood' },
        ],
      },
    },
  ]);

  if (resultsPending.length > 10) {
    await Flag.create({
      edrId: data.edrId,
      generatedFrom: 'Lab Technician',
      card: '4th',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Blood Test Results Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Lab Technician',
      status: 'pending',
    });
    globalVariable.io.emit('ltPending', flags);
  }

  Notification(
    'Lab Test',
    'Lab Test Request',
    'Lab Technician',
    'ED Doctor',
    '/dashboard/taskslist',
    data.edrId,
    ''
  );

  Notification(
    'Lab Request',
    'Lab Request',
    'Admin',
    'Lab Requests',
    '/dashboard/taskslist',
    data.edrId,
    ''
  );
});

module.exports = addLabRequest;
