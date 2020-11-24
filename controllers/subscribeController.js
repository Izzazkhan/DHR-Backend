const webpush = require('web-push');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');

exports.getSubscription = asyncHandler(async (req, res, next) => {
	const subscription = req.body;

	res.status(201).json({});

	const payload = JSON.stringify({ title: 'Push Test' });

	webpush
		.sendNotification(subscription, payload)
		.catch(err => console.log(err));
});
