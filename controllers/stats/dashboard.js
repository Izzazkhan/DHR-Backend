const moment = require('moment');
const Patient = require('../../models/patient/patient');
const Room = require('../../models/room');

const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const EDR = require('../../models/EDR/EDR');

const currentTime = moment().utc().toDate();
const lastHour = moment().subtract(1, 'hours').utc().toDate();
const fifthHour = moment().subtract(2, 'hours').utc().toDate();
const fourthHour = moment().subtract(3, 'hours').utc().toDate();
const thirdHour = moment().subtract(4, 'hours').utc().toDate();
const secondHour = moment().subtract(5, 'hours').utc().toDate();
const sixHour = moment().subtract(6, 'hours').utc().toDate();

let arr = [
  { label: lastHour, value: 0 },
  { label: fifthHour, value: 0 },
  { label: fourthHour, value: 0 },
  { label: thirdHour, value: 0 },
  { label: secondHour, value: 0 },
  { label: sixHour, value: 0 },
];

function clearAllTime() {
  arr = [
    { label: lastHour, value: 0 },
    { label: fifthHour, value: 0 },
    { label: fourthHour, value: 0 },
    { label: thirdHour, value: 0 },
    { label: secondHour, value: 0 },
    { label: sixHour, value: 0 },
  ];
}

function compareDataForSixHours(dateTime) {
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
  }
}
// Clinical Pharmacist Dashboard
exports.cpDashboard = asyncHandler(async (req, res, next) => {
  const pendingOrders = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { 'pharmacyRequest.status': 'pending' },
          { 'pharmacyRequest.createdAt': { $gte: sixHour } },
        ],
      },
    },
  ]);

  pendingOrders.map((o) => compareDataForSixHours(o.pharmacyRequest.createdAt));

  const perHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT
  const completedOrders = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { 'pharmacyRequest.status': 'in_progress' },
          { 'pharmacyRequest.progressStartTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let orderTime = 0;
  completedOrders.forEach((t) => {
    t.startTime = new Date(t.pharmacyRequest.createdAt);
    t.endTime = new Date(t.pharmacyRequest.progressStartTime);
    t.time = Math.round(
      (t.endTime.getTime() - t.startTime.getTime()) / (1000 * 60)
    );
    orderTime += t.time;
  });
  const orderTAT =
    completedOrders.length > 0 ? orderTime / completedOrders.length : 0;

  // * 3rd Card
  completedOrders.map((o) => {
    compareDataForSixHours(o.pharmacyRequest.progressStartTime);
  });

  const CompletedPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();
  const orderCompletedTAT =
    completedOrders.length > 0 ? 360 / completedOrders.length : 0;

  // Cumulative Number Of Orders
  const cumulativeOrders = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        'pharmacyRequest.status': 'in_progress',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    firstCard: {
      TAT: orderTAT,
      totalPending: pendingOrders.length,
      perHour,
    },
    thirdCard: {
      TAT: orderCompletedTAT,
      totalPending: completedOrders.length,
      perHour: CompletedPerHour,
    },
    cumulativeOrders: cumulativeOrders.length,
  });
});

// * Imaging Technician Dashboard
exports.itDashboard = asyncHandler(async (req, res, next) => {
  function compareData(hold, active, requested) {
    if (
      (hold > lastHour && hold < currentTime) ||
      (active > lastHour && active < currentTime) ||
      (requested > lastHour && requested < currentTime)
    ) {
      arr[0] = { label: arr[0].label, value: arr[0].value + 1 };
    } else if (
      (hold > fifthHour && hold < lastHour) ||
      (active > fifthHour && active < lastHour) ||
      (requested > fifthHour && requested < lastHour)
    ) {
      arr[1] = { label: arr[1].label, value: arr[1].value + 1 };
    } else if (
      (hold > fourthHour && hold < fifthHour) ||
      (active > fourthHour && active < fifthHour) ||
      (requested > fourthHour && requested < fifthHour)
    ) {
      arr[2] = { label: arr[2].label, value: arr[2].value + 1 };
    } else if (
      (hold > thirdHour && hold < fourthHour) ||
      (active > thirdHour && active < fourthHour) ||
      (requested > thirdHour && requested < fourthHour)
    ) {
      arr[3] = { label: arr[3].label, value: arr[3].value + 1 };
    } else if (
      (hold > secondHour && hold < thirdHour) ||
      (active > secondHour && active < thirdHour) ||
      (requested > secondHour && requested < thirdHour)
    ) {
      arr[4] = { label: arr[4].label, value: arr[4].value + 1 };
    } else if (
      (hold > sixHour && hold < secondHour) ||
      (active > sixHour && active < secondHour) ||
      (requested > sixHour && requested < secondHour)
    ) {
      arr[5] = { label: arr[5].label, value: arr[5].value + 1 };
    }
  }
  const pendingRads = await EDR.aggregate([
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
        $and: [
          {
            $or: [
              { 'radRequest.status': 'pending' },
              { 'radRequest.status': 'active' },
              { 'radRequest.status': 'hold' },
            ],
          },
          {
            $or: [
              { 'radRequest.holdTime': { $gte: sixHour } },
              { 'radRequest.activeTime': { $gte: sixHour } },
              { 'radRequest.requestedAt': { $gte: sixHour } },
            ],
          },
        ],
      },
    },
  ]);

  pendingRads.map((o) =>
    compareData(
      o.radRequest.holdTime,
      o.radRequest.activeTime,
      o.radRequest.requestedAt
    )
  );

  const perHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT
  const completedRads = await EDR.aggregate([
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
        $and: [
          { 'radRequest.status': 'pending approval' },
          { 'radRequest.pendingApprovalTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let radTime = 0;
  completedRads.forEach((t) => {
    t.startTime = new Date(t.radRequest.requestedAt);
    t.endTime = new Date(t.radRequest.pendingApprovalTime);
    t.time = Math.round(
      (t.endTime.getTime() - t.startTime.getTime()) / (1000 * 60)
    );
    radTime += t.time;
  });
  const orderTAT =
    completedRads.length > 0 ? radTime / completedRads.length : 0;

  // * 2nd Card

  completedRads.map((o) =>
    compareDataForSixHours(o.radRequest.pendingApprovalTime)
  );

  const completedPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT
  const approvedRads = await EDR.aggregate([
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
        $and: [
          { 'radRequest.status': 'completed' },
          { 'radRequest.completeTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let approvedTime = 0;
  approvedRads.forEach((t) => {
    t.startTime = new Date(t.radRequest.requestedAt);
    t.endTime = new Date(t.radRequest.completeTime);
    t.time = Math.round(
      (t.endTime.getTime() - t.startTime.getTime()) / (1000 * 60)
    );
    approvedTime += t.time;
  });
  const approvedTAT =
    approvedRads.length > 0 ? approvedTime / approvedRads.length : 0;

  // * 3rd Card
  const patients = await EDR.aggregate([
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
        'radRequest.requestedAt': { $gte: sixHour },
      },
    },
  ]);

  patients.map((o) => compareDataForSixHours(o.radRequest.requestedAt));

  const patientsPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //  * Cumulative Patients
  const cumulativePatients = await EDR.aggregate([
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
        'radRequest.status': 'pending approval',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    firstCard: {
      TAT: orderTAT,
      totalPending: pendingRads.length,
      perHour,
    },
    secondCard: {
      TAT: approvedTAT,
      totalPending: completedRads.length,
      perHour: completedPerHour,
    },
    thirdCard: {
      TAT: orderTAT,
      totalPending: patients.length,
      perHour: patientsPerHour,
    },
    cumulativePatients: cumulativePatients.length,
  });
});

// * Rad Doctor Dashboard
exports.rdDashboard = asyncHandler(async (req, res, next) => {
  const pendingRad = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
      },
    },
    {
      $match: {
        status: 'pending',
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { 'radRequest.status': 'pending approval' },
          { 'radRequest.pendingApprovalTime': { $gte: sixHour } },
          { 'radRequest.pendingApprovalTime': { $lte: currentTime } },
        ],
      },
    },
  ]);
  pendingRad.map((o) =>
    compareDataForSixHours(o.radRequest.pendingApprovalTime)
  );

  const radsPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT
  const completedRad = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
      },
    },
    {
      $match: {
        status: 'pending',
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { 'radRequest.status': 'completed' },
          { 'radRequest.completeTime': { $gte: sixHour } },
          { 'radRequest.completeTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  let radTime = 0;
  completedRad.map((t) => {
    t.radStart = new Date(t.radRequest.pendingApprovalTime);

    t.radEnd = new Date(t.radRequest.completeTime);

    t.time = Math.round(
      (t.radEnd.getTime() - t.radStart.getTime()) / (1000 * 60)
    );
    radTime += t.time;
  });

  const completedRadTAT = radTime / completedRad.length;

  //   * 2nd Card
  completedRad.map((o) => compareDataForSixHours(o.radRequest.completeTime));

  const completedPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // *  Cumulative Notes
  const cumulativeNotes = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
      },
    },
    {
      $match: {
        status: 'pending',
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        'radRequest.status': 'completed',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    firstCard: {
      TAT: completedRadTAT,
      totalPending: pendingRad.length,
      perHour: radsPerHour,
    },
    secondCard: {
      TAT: completedRadTAT,
      totalPending: completedRad.length,
      perHour: completedPerHour,
    },
    cumulativeNotes: cumulativeNotes.length,
  });
});
