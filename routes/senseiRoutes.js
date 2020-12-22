const express = require('express');
// const { protect } = require('../controllers/authController');
const {
updateStaffShift
} = require('../controllers/senseiController');

const router = express.Router();
router.put('/assignShifts',updateStaffShift);
module.exports = router;
