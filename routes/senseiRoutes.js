const express = require('express');
// const { protect } = require('../controllers/authController');
const {
  updateStaffShift,
  getCCPatients,
  getPatientsByPA,
  patientsByCC,
  // getNoOfPatientsByCC,
  getPatientByRoom,
  searchCCPatients,
  getICR,
  getECR
} = require('../controllers/senseiController');

const router = express.Router();
router.put('/assignShifts', updateStaffShift);
router.get('/getCCPatients', getCCPatients);
router.get('/getPatientsByPA/:productionAreaId', getPatientsByPA);
router.get('/patientsByCC', patientsByCC);
router.get('/getICR', getICR);
router.get('/getECR', getECR);
// router.get('/getNoOfPatientsByCC/:id', getNoOfPatientsByCC);
router.get('/getPatientByRoom/:roomId', getPatientByRoom);
router.get('/searchCCPatients/:keyword', searchCCPatients);
module.exports = router;
