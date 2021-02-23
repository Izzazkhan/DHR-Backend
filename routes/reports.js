const express = require('express');

const router = express.Router();

const {
  roDashboard,
  roSenseiPending,
  roTotalPending,
  anesthesiologistDashboard,
  hkDashboard,
  hkRoomPending,
  senseiDashboard,
  edDoctorDashboard,
  externalConsultantDB,
  internalConsultantDB,
} = require('../controllers/reports');

// Registration Officer
router.get('/roDashboard', roDashboard);
router.get('/roSenseiPending', roSenseiPending);
router.get('/roTotalPending', roTotalPending);

router.get('/hkDashboard', hkDashboard);
router.get('/hkRoomPending', hkRoomPending);
router.get('/anesthesiologistDB', anesthesiologistDashboard);
router.get('/senseiDashboard', senseiDashboard);
router.get('/edDoctorDashboard', edDoctorDashboard);
router.get('/externalConsultantDB', externalConsultantDB);
router.get('/internalConsultantDB', internalConsultantDB);
module.exports = router;
