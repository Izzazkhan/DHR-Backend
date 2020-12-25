const express = require('express');
// const { protect } = require('../controllers/authController');
const {
  updateStaffShift,
  getCCPatients,
  getPatientsByPA,
} = require('../controllers/senseiController');

const router = express.Router();
router.put('/assignShifts', updateStaffShift);
router.get('/getCCPatients', getCCPatients);
router.get('/getPatientsByPA/:productionAreaId', getPatientsByPA);
module.exports = router;
