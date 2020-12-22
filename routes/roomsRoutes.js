const express = require('express');

const router = express.Router();
const { assignRoom } = require('../controllers/roomController');

router.route('/').post(assignRoom);

module.exports = router;
