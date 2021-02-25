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

// Clinical Pharmacist Dashboard
exports.cpDashboard = asyncHandler(async (req, res, next) => {
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

  pendingOrders.map((o) => {
    compareDataForSixHours(o.pharmacyRequest.createdAt);
  });

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
    firsCard: {
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
