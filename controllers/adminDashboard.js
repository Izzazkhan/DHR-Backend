const moment = require('moment');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const ChiefComplaints = require('../models/chiefComplaint/chiefComplaint');
const CareStreams = require('../models/CareStreams/CareStreams');
const LabServices = require('../models/service/lab');
const RadServices = require('../models/service/radiology');
const Item = require('../models/item');
const Staff = require('../models/staffFhir/staff');
const Shifts = require('../models/shift');
const patientFHIR = require('../models/patient/patient');

// Most Selected Chief Complaints
exports.chiefComplaints = asyncHandler(async (req, res) => {
  const sixHour = moment().subtract(6, 'hours').utc().toDate();
  // Patients who were assigned a chief complaint in the last 6 hours
  const assignedCareStreams = await EDR.aggregate([
    {
      $project: {
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$chiefComplaint',
    },
    {
      $match: { 'chiefComplaint.assignedTime': { $gte: sixHour } },
    },
  ]);
  const chiefComplaints = await ChiefComplaints.aggregate([
    {
      $match: {
        $and: [{ availability: true }, { disabled: false }],
      },
    },
    {
      $project: {
        name: 1,
        chiefComplaintId: 1,
      },
    },
  ]);
  for (let i = 0; i < chiefComplaints.length; i++) {
    if (assignedCareStreams.length > 0) {
      for (let j = 0; j < assignedCareStreams.length; j++) {
        if (
          chiefComplaints[i]._id.toString() ===
          assignedCareStreams[j].chiefComplaint.chiefComplaintId.toString()
        ) {
          if (!chiefComplaints[i].selected) {
            chiefComplaints[i].selected = 1;
          } else {
            chiefComplaints[i].selected++;
          }
        } else if (!chiefComplaints[i].selected) {
          chiefComplaints[i].selected = 0;
        }
      }
    } else {
      chiefComplaints[i].selected = 0;
    }
  }
  res.status(200).json({
    success: true,
    data: chiefComplaints,
  });
});

// Most Selected CareStreams
exports.careStreams = asyncHandler(async (req, res) => {
  const sixHour = moment().subtract(6, 'hours').utc().toDate();
  // Patients who were assigned a careStream in the last 6 hours
  const assignedCareStreams = await EDR.aggregate([
    {
      $project: {
        careStream: 1,
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: { 'careStream.assignedTime': { $gte: sixHour } },
    },
  ]);
  const careStreams = await CareStreams.aggregate([
    {
      $match: { disabled: false },
    },
    {
      $project: {
        name: 1,
        identifier: 1,
      },
    },
  ]);
  for (let i = 0; i < careStreams.length; i++) {
    if (assignedCareStreams.length > 0) {
      for (let j = 0; j < assignedCareStreams.length; j++) {
        if (
          careStreams[i]._id.toString() ===
          assignedCareStreams[j].careStream.careStreamId.toString()
        ) {
          if (!careStreams[i].selected) {
            careStreams[i].selected = 1;
          } else {
            careStreams[i].selected++;
          }
        } else if (!careStreams[i].selected) {
          careStreams[i].selected = 0;
        }
      }
    } else {
      careStreams[i].selected = 0;
    }
  }
  res.status(200).json({
    success: true,
    data: careStreams,
  });
});

// Most Requested Lab Tests
exports.labTests = asyncHandler(async (req, res) => {
  const sixHour = moment().subtract(6, 'hours').utc().toDate();
  // Patients who requested lab service in the last 6 hours
  const requestedLabReq = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: { 'labRequest.requestedAt': { $gte: sixHour } },
    },
  ]);
  const labServices = await LabServices.aggregate([
    {
      $match: { disabled: false },
    },
    {
      $project: {
        name: 1,
        identifier: 1,
        type: 1,
      },
    },
  ]);
  for (let i = 0; i < labServices.length; i++) {
    labServices[i].lastRequested = '';
    if (requestedLabReq.length > 0) {
      for (let j = 0; j < requestedLabReq.length; j++) {
        if (
          labServices[i]._id.toString() ===
          requestedLabReq[j].labRequest.serviceId.toString()
        ) {
          if (!labServices[i].selected) {
            labServices[i].selected = 1;
          } else {
            labServices[i].selected++;
          }
          if ((labServices[i].lastRequested = '')) {
            labServices[i].lastRequested =
              requestedLabReq[j].labRequest.requestedAt;
          } else if (
            labServices[i].lastRequested <=
            requestedLabReq[j].labRequest.requestedAt
          ) {
            labServices[i].lastRequested =
              requestedLabReq[j].labRequest.requestedAt;
          }
        } else if (!labServices[i].selected) {
          labServices[i].selected = 0;
        }
      }
    } else {
      labServices[i].selected = 0;
    }
  }
  res.status(200).json({
    success: true,
    data: labServices,
  });
});

// Most Requested Rad Tests
exports.radiologyExams = asyncHandler(async (req, res) => {
  const sixHour = moment().subtract(6, 'hours').utc().toDate();
  // Patients who requested rad service in the last 6 hours
  const requestedRadReq = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: { 'radRequest.requestedAt': { $gte: sixHour } },
    },
  ]);
  const radServices = await RadServices.aggregate([
    {
      $match: { disabled: false },
    },
    {
      $project: {
        name: 1,
        identifier: 1,
        type: 1,
      },
    },
  ]);
  for (let i = 0; i < radServices.length; i++) {
    radServices[i].lastRequested = '';
    if (requestedRadReq.length > 0) {
      for (let j = 0; j < requestedRadReq.length; j++) {
        if (
          radServices[i]._id.toString() ===
          requestedRadReq[j].radRequest.serviceId.toString()
        ) {
          if (!radServices[i].selected) {
            radServices[i].selected = 1;
          } else {
            radServices[i].selected++;
          }
          if ((radServices[i].lastRequested = '')) {
            radServices[i].lastRequested =
              requestedRadReq[j].radRequest.requestedAt;
          } else if (
            radServices[i].lastRequested <=
            requestedRadReq[j].radRequest.requestedAt
          ) {
            radServices[i].lastRequested =
              requestedRadReq[j].radRequest.requestedAt;
          }
        } else if (!radServices[i].selected) {
          radServices[i].selected = 0;
        }
      }
    } else {
      radServices[i].selected = 0;
    }
  }
  res.status(200).json({
    success: true,
    data: radServices,
  });
});

// Most Requested Medication
exports.medication = asyncHandler(async (req, res) => {
  const sixHour = moment().subtract(6, 'hours').utc().toDate();
  // Patients who requested medicines in the last 6 hours
  const requestedPharmas = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: { 'pharmacyRequest.createdAt': { $gte: sixHour } },
    },
  ]);
  const items = await Item.aggregate([
    {
      $match: { cls: 'Medical' },
    },
    {
      $project: {
        name: 1,
        itemCode: 1,
        medClass: 1,
        scientificName: 1,
        vendorId: 1,
      },
    },
  ]);
  const vendorItems = await Item.populate(items, [
    {
      path: 'vendorId',
      model: 'Vendor',
      select: 'englishName',
    },
  ]);

  for (let i = 0; i < vendorItems.length; i++) {
    if (requestedPharmas.length > 0) {
      for (let j = 0; j < requestedPharmas.length; j++) {
        let items = requestedPharmas[j].pharmacyRequest.item;

        for (let k = 0; k < items.length; k++) {
          if (vendorItems[i]._id.toString() === items[k].itemId.toString()) {
            if (!vendorItems[i].selected) {
              vendorItems[i].selected = 1;
            } else {
              vendorItems[i].selected++;
            }
          } else if (!vendorItems[i].selected) {
            vendorItems[i].selected = 0;
          }
        }
      }
    } else {
      vendorItems[i].selected = 0;
    }
  }
  res.status(200).json({
    success: true,
    data: vendorItems,
  });
});

// Dashboard Comulative Data.
exports.dashboard = asyncHandler(async (req, res) => {
  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();
  const sevenHour = moment().subtract(7, 'hours').utc().toDate();
  const eightHour = moment().subtract(8, 'hours').utc().toDate();
  const nineHour = moment().subtract(9, 'hours').utc().toDate();
  const tenHour = moment().subtract(10, 'hours').utc().toDate();
  const elevenHour = moment().subtract(11, 'hours').utc().toDate();
  const twelveHour = moment().subtract(12, 'hours').utc().toDate();
  const thirteenHour = moment().subtract(13, 'hours').utc().toDate();
  const fourteenHour = moment().subtract(14, 'hours').utc().toDate();
  const fifteenHour = moment().subtract(15, 'hours').utc().toDate();
  const sixteenHour = moment().subtract(16, 'hours').utc().toDate();
  const seventeenHour = moment().subtract(17, 'hours').utc().toDate();
  const eighteenHour = moment().subtract(18, 'hours').utc().toDate();
  const nineteenHour = moment().subtract(19, 'hours').utc().toDate();
  const twentyHour = moment().subtract(20, 'hours').utc().toDate();
  const twentyOneHour = moment().subtract(21, 'hours').utc().toDate();
  const twentyTwoHour = moment().subtract(22, 'hours').utc().toDate();
  const twetyThreeHour = moment().subtract(23, 'hours').utc().toDate();
  const twentyFourHour = moment().subtract(24, 'hours').utc().toDate();

  // Patients who were assigned a chief complaint in the last 6 hours
  const assignedChiefComplaints = await EDR.aggregate([
    {
      $project: {
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$chiefComplaint',
    },
    {
      $match: { 'chiefComplaint.assignedTime': { $gte: sixHour } },
    },
  ]);
  const chiefComplaints = await ChiefComplaints.aggregate([
    {
      $match: {
        $and: [{ availability: true }, { disabled: false }],
      },
    },
    {
      $project: {
        name: 1,
        chiefComplaintId: 1,
      },
    },
  ]);
  for (let i = 0; i < chiefComplaints.length; i++) {
    if (assignedChiefComplaints.length > 0) {
      for (let j = 0; j < assignedChiefComplaints.length; j++) {
        if (
          chiefComplaints[i]._id.toString() ===
          assignedChiefComplaints[j].chiefComplaint.chiefComplaintId.toString()
        ) {
          if (!chiefComplaints[i].selected) {
            chiefComplaints[i].selected = 1;
          } else {
            chiefComplaints[i].selected++;
          }
        } else if (!chiefComplaints[i].selected) {
          chiefComplaints[i].selected = 0;
        }
      }
    } else {
      chiefComplaints[i].selected = 0;
    }
  }
  let totalCC = 0;
  chiefComplaints.map((d) => {
    totalCC += d.selected;
  });

  // Patients who were assigned a careStream in the last 6 hours
  const assignedCareStreams = await EDR.aggregate([
    {
      $project: {
        careStream: 1,
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: { 'careStream.assignedTime': { $gte: sixHour } },
    },
  ]);
  const careStreams = await CareStreams.aggregate([
    {
      $match: { disabled: false },
    },
    {
      $project: {
        name: 1,
        identifier: 1,
      },
    },
  ]);
  for (let i = 0; i < careStreams.length; i++) {
    if (assignedCareStreams.length > 0) {
      for (let j = 0; j < assignedCareStreams.length; j++) {
        if (
          careStreams[i]._id.toString() ===
          assignedCareStreams[j].careStream.careStreamId.toString()
        ) {
          if (!careStreams[i].selected) {
            careStreams[i].selected = 1;
          } else {
            careStreams[i].selected++;
          }
        } else if (!careStreams[i].selected) {
          careStreams[i].selected = 0;
        }
      }
    } else {
      careStreams[i].selected = 0;
    }
  }
  let totalCS = 0;
  careStreams.map((d) => {
    totalCS += d.selected;
  });

  // Patients who requested lab service in the last 6 hours
  const requestedLabReq = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: { 'labRequest.requestedAt': { $gte: sixHour } },
    },
  ]);
  const labServices = await LabServices.aggregate([
    {
      $match: { disabled: false },
    },
    {
      $project: {
        name: 1,
        identifier: 1,
        type: 1,
      },
    },
  ]);
  for (let i = 0; i < labServices.length; i++) {
    labServices[i].lastRequested = '';
    if (requestedLabReq.length > 0) {
      for (let j = 0; j < requestedLabReq.length; j++) {
        if (
          labServices[i]._id.toString() ===
          requestedLabReq[j].labRequest.serviceId.toString()
        ) {
          if (!labServices[i].selected) {
            labServices[i].selected = 1;
          } else {
            labServices[i].selected++;
          }
          if ((labServices[i].lastRequested = '')) {
            labServices[i].lastRequested =
              requestedLabReq[j].labRequest.requestedAt;
          } else if (
            labServices[i].lastRequested <=
            requestedLabReq[j].labRequest.requestedAt
          ) {
            labServices[i].lastRequested =
              requestedLabReq[j].labRequest.requestedAt;
          }
        } else if (!labServices[i].selected) {
          labServices[i].selected = 0;
        }
      }
    } else {
      labServices[i].selected = 0;
    }
  }
  let totalLabServices = 0;
  labServices.map((d) => {
    totalLabServices += d.selected;
  });

  // Patients who requested rad service in the last 6 hours
  const requestedRadReq = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: { 'radRequest.requestedAt': { $gte: sixHour } },
    },
  ]);
  const radServices = await RadServices.aggregate([
    {
      $match: { disabled: false },
    },
    {
      $project: {
        name: 1,
        identifier: 1,
        type: 1,
      },
    },
  ]);
  for (let i = 0; i < radServices.length; i++) {
    radServices[i].lastRequested = '';
    if (requestedRadReq.length > 0) {
      for (let j = 0; j < requestedRadReq.length; j++) {
        if (
          radServices[i]._id.toString() ===
          requestedRadReq[j].radRequest.serviceId.toString()
        ) {
          if (!radServices[i].selected) {
            radServices[i].selected = 1;
          } else {
            radServices[i].selected++;
          }
          if ((radServices[i].lastRequested = '')) {
            radServices[i].lastRequested =
              requestedRadReq[j].radRequest.requestedAt;
          } else if (
            radServices[i].lastRequested <=
            requestedRadReq[j].radRequest.requestedAt
          ) {
            radServices[i].lastRequested =
              requestedRadReq[j].radRequest.requestedAt;
          }
        } else if (!radServices[i].selected) {
          radServices[i].selected = 0;
        }
      }
    } else {
      radServices[i].selected = 0;
    }
  }
  let totalRadServices = 0;
  radServices.map((d) => {
    totalRadServices += d.selected;
  });

  // Patients who requested medicines in the last 6 hours
  const requestedPharmas = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: { 'pharmacyRequest.createdAt': { $gte: sixHour } },
    },
  ]);
  const items = await Item.aggregate([
    {
      $match: { cls: 'Medical' },
    },
    {
      $project: {
        name: 1,
        itemCode: 1,
        medClass: 1,
        scientificName: 1,
        vendorId: 1,
      },
    },
  ]);
  const vendorItems = await Item.populate(items, [
    {
      path: 'vendorId',
      model: 'Vendor',
      select: 'englishName',
    },
  ]);

  for (let i = 0; i < vendorItems.length; i++) {
    if (requestedPharmas.length > 0) {
      for (let j = 0; j < requestedPharmas.length; j++) {
        let items = requestedPharmas[j].pharmacyRequest.item;

        for (let k = 0; k < items.length; k++) {
          if (vendorItems[i]._id.toString() === items[k].itemId.toString()) {
            if (!vendorItems[i].selected) {
              vendorItems[i].selected = 1;
            } else {
              vendorItems[i].selected++;
            }
          } else if (!vendorItems[i].selected) {
            vendorItems[i].selected = 0;
          }
        }
      }
    } else {
      vendorItems[i].selected = 0;
    }
  }
  let totalMedication = 0;
  vendorItems.map((d) => {
    totalMedication += d.selected;
  });

  const doctors = await Staff.find({
    shift: { $exists: true },
    staffType: 'Doctor',
    disabled: false,
    availability: true,
    chiefComplaint: { $ne: [] },
  })
    .select('shift')
    .populate('shift');

  const DoctorsInMorning = doctors.filter((d) => d.shift.name === 'Morning');
  const DoctorsInEvening = doctors.filter((d) => d.shift.name === 'Evening');
  const DoctorsInNight = doctors.filter((d) => d.shift.name === 'Night');

  const nurses = await Staff.find({
    shift: { $exists: true },
    staffType: 'Nurses',
    disabled: false,
    availability: true,
    chiefComplaint: { $ne: [] },
  })
    .select('shift')
    .populate('shift');

  const NursesInMorning = nurses.filter((d) => d.shift.name === 'Morning');
  const NursesInEvening = nurses.filter((d) => d.shift.name === 'Evening');
  const NursesInNight = nurses.filter((d) => d.shift.name === 'Night');

  let arr = [
    { label: lastHour, value: 0 },
    { label: fifthHour, value: 0 },
    { label: fourthHour, value: 0 },
    { label: thirdHour, value: 0 },
    { label: secondHour, value: 0 },
    { label: sixHour, value: 0 },
    { label: sevenHour, value: 0 },
    { label: eightHour, value: 0 },
    { label: nineHour, value: 0 },
    { label: tenHour, value: 0 },
    { label: elevenHour, value: 0 },
    { label: twelveHour, value: 0 },
    { label: thirteenHour, value: 0 },
    { label: fourteenHour, value: 0 },
    { label: fifteenHour, value: 0 },
    { label: sixteenHour, value: 0 },
    { label: seventeenHour, value: 0 },
    { label: eighteenHour, value: 0 },
    { label: nineteenHour, value: 0 },
    { label: twentyHour, value: 0 },
    { label: twentyOneHour, value: 0 },
    { label: twentyTwoHour, value: 0 },
    { label: twetyThreeHour, value: 0 },
    { label: twentyFourHour, value: 0 },
  ];

  function clearAllTime() {
    arr = [
      { label: lastHour, value: 0 },
      { label: fifthHour, value: 0 },
      { label: fourthHour, value: 0 },
      { label: thirdHour, value: 0 },
      { label: secondHour, value: 0 },
      { label: sixHour, value: 0 },
      { label: sevenHour, value: 0 },
      { label: eightHour, value: 0 },
      { label: nineHour, value: 0 },
      { label: tenHour, value: 0 },
      { label: elevenHour, value: 0 },
      { label: twelveHour, value: 0 },
      { label: thirteenHour, value: 0 },
      { label: fourteenHour, value: 0 },
      { label: fifteenHour, value: 0 },
      { label: sixteenHour, value: 0 },
      { label: seventeenHour, value: 0 },
      { label: eighteenHour, value: 0 },
      { label: nineteenHour, value: 0 },
      { label: twentyHour, value: 0 },
      { label: twentyOneHour, value: 0 },
      { label: twentyTwoHour, value: 0 },
      { label: twetyThreeHour, value: 0 },
      { label: twentyFourHour, value: 0 },
    ];
  }

  function compareDataForTwentyFourHours(dateTime) {
    if (dateTime > lastHour && dateTime < currentTime) {
      arr[0] = { label: arr[0].label, value: arr[0].value + 1 };
    } else if (dateTime > fifthHour && dateTime < lastHour) {
      arr[1] = { label: arr[1].label, value: arr[1].value + 1 };
    } else if (dateTime > fourthHour && dateTime < fifthHour) {
      arr[2] = { label: arr[2].label, value: arr[2].value + 1 };
    } else if (dateTime > thirdHour && dateTime < fourthHour) {
      arr[3] = { label: arr[3].label, value: arr[3].value + 1 };
    } else if (dateTime > secondHour && dateTime < thirdHour) {
      arr[4] = { label: arr[4].label, value: arr[4].value + 1 };
    } else if (dateTime > sixHour && dateTime < secondHour) {
      arr[5] = { label: arr[5].label, value: arr[5].value + 1 };
    } else if (dateTime > sevenHour && dateTime < sixHour) {
      arr[6] = { label: arr[6].label, value: arr[6].value + 1 };
    } else if (dateTime > eightHour && dateTime < sevenHour) {
      arr[7] = { label: arr[7].label, value: arr[7].value + 1 };
    } else if (dateTime > nineHour && dateTime < eightHour) {
      arr[8] = { label: arr[8].label, value: arr[8].value + 1 };
    } else if (dateTime > tenHour && dateTime < nineHour) {
      arr[9] = { label: arr[9].label, value: arr[9].value + 1 };
    } else if (dateTime > elevenHour && dateTime < tenHour) {
      arr[10] = { label: arr[10].label, value: arr[10].value + 1 };
    } else if (dateTime > twelveHour && dateTime < elevenHour) {
      arr[11] = { label: arr[11].label, value: arr[11].value + 1 };
    } else if (dateTime > thirteenHour && dateTime < twelveHour) {
      arr[12] = { label: arr[12].label, value: arr[12].value + 1 };
    } else if (dateTime > fourteenHour && dateTime < thirteenHour) {
      arr[13] = { label: arr[13].label, value: arr[13].value + 1 };
    } else if (dateTime > fifteenHour && dateTime < fourteenHour) {
      arr[14] = { label: arr[14].label, value: arr[14].value + 1 };
    } else if (dateTime > sixteenHour && dateTime < fifteenHour) {
      arr[15] = { label: arr[15].label, value: arr[15].value + 1 };
    } else if (dateTime > seventeenHour && dateTime < sixteenHour) {
      arr[16] = { label: arr[16].label, value: arr[16].value + 1 };
    } else if (dateTime > eighteenHour && dateTime < seventeenHour) {
      arr[17] = { label: arr[17].label, value: arr[17].value + 1 };
    } else if (dateTime > nineteenHour && dateTime < eighteenHour) {
      arr[18] = { label: arr[18].label, value: arr[18].value + 1 };
    } else if (dateTime > twentyHour && dateTime < nineteenHour) {
      arr[19] = { label: arr[19].label, value: arr[19].value + 1 };
    } else if (dateTime > twentyOneHour && dateTime < twentyHour) {
      arr[20] = { label: arr[20].label, value: arr[20].value + 1 };
    } else if (dateTime > twentyTwoHour && dateTime < twentyOneHour) {
      arr[21] = { label: arr[21].label, value: arr[21].value + 1 };
    } else if (dateTime > twetyThreeHour && dateTime < twentyTwoHour) {
      arr[22] = { label: arr[22].label, value: arr[22].value + 1 };
    } else if (dateTime > twentyFourHour && dateTime < twetyThreeHour) {
      arr[23] = { label: arr[23].label, value: arr[23].value + 1 };
    }
  }

  const patientsRegistered = await patientFHIR.find({
    createdAt: { $gte: twentyFourHour },
  });

  patientsRegistered.map((p) => {
    compareDataForTwentyFourHours(p.createdAt);
  });

  const patientsRegisteredPerHour = JSON.parse(JSON.stringify(arr));

  const peakValue = Math.max.apply(
    Math,
    patientsRegisteredPerHour.map(function (o) {
      return o.value;
    })
  );
  var peakTime = patientsRegisteredPerHour.find(function (o) {
    return o.value == peakValue;
  });

  clearAllTime();

  res.status(200).json({
    success: true,
    data: {
      totalCC,
      totalCS,
      totalLabServices,
      totalRadServices,
      totalMedication,
      DoctorsInMorning: DoctorsInMorning.length,
      DoctorsInEvening: DoctorsInEvening.length,
      DoctorsInNight: DoctorsInNight.length,
      NursesInMorning: NursesInMorning.length,
      NursesInEvening: NursesInEvening.length,
      NursesInNight: NursesInNight.length,
      peakTimeForPatients: {
        totalPatients: patientsRegistered.length,
        perHour: patientsRegisteredPerHour,
        peakTime: peakTime.label,
      },
    },
  });
});

// Doctors assigned in shifts
exports.doctorsAssigned = asyncHandler(async (req, res) => {
  const doctors = await Staff.find({
    shift: { $exists: true },
    staffType: 'Doctor',
    disabled: false,
    availability: true,
    chiefComplaint: { $ne: [] },
  })
    .select(
      'specialty subType identifier name staffType shift chiefComplaint createdAt'
    )
    .populate('shift')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
    ]);

  res.status(200).json({
    success: true,
    data: doctors,
  });
});

// Nurses assigned in shifts
exports.nursesAssigned = asyncHandler(async (req, res) => {
  const nurses = await Staff.find({
    shift: { $exists: true },
    staffType: 'Nurses',
    disabled: false,
    availability: true,
    chiefComplaint: { $ne: [] },
  })
    .select(
      'specialty subType identifier name staffType shift chiefComplaint createdAt'
    )
    .populate('shift')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
    ]);

  res.status(200).json({
    success: true,
    data: nurses,
  });
});
