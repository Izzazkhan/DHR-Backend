const express = require('express');
// const { protect } = require('../controllers/authController');
const {
  updateStaffShift,
  getCCPatients,
} = require('../controllers/senseiController');

const router = express.Router();
router.put('/assignShifts', updateStaffShift);
router.get('/getCCPatients', getCCPatients);
module.exports = router;
