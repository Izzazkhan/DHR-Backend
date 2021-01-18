const express = require('express');

const { houseKeeperRequests } = require('../controllers/houseKeeperRequest');

const router = express.Router();

router.get('/getPendingHKRequests', houseKeeperRequests);

module.exports = router;
