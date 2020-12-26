const express = require('express');
// const { protect } = require('../controllers/authController');
const {
  updateStaffShift,
  getCCPatients,
  getPatientsByPA,
  patientsByCC,
  getNoOfPatientsByCC,
  getPatientByRoom,
} = require('../controllers/senseiController');

const router = express.Router();
router.put('/assignShifts', updateStaffShift);
router.get('/getCCPatients', getCCPatients);
router.get('/getPatientsByPA/:productionAreaId', getPatientsByPA);
router.get('/patientsByCC', patientsByCC);
router.get('/getNoOfPatientsByCC/:id', getNoOfPatientsByCC);
router.get('/getPatientByRoom/:roomId', getPatientByRoom);
module.exports = router;
