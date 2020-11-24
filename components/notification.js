const webpush = require('web-push');

webpush.setVapidDetails(
	'mailto:pmdevteam0@gmail.com',
	process.env.PUBLIC_VAPID_KEYS,
	process.env.PRIVATE_VAPID_KEYS
);
