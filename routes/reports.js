const express = require('express');

const router = express.Router();

const {
  roDashboard,
  roSenseiPending,
  roTotalPending,
  anesthesiologistDashboard,
  hkDashboard,
  hkRoomPending,
  // senseiDashboard,
  edDoctorDashboard,
  externalConsultantDB,
  internalConsultantDB,
  swDashboard,
  ccDashboard,
} = require('../controllers/reports');

const { senseiDashboard } = require('../controllers/stats/senseiDashboard');
const {
  cpDashboard,
  itDashboard,
  rdDashboard,
  ntDashboard,
  ltDashboard,
} = require('../controllers/stats/dashboard');

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
router.get('/swDashboard', swDashboard);
router.get('/ccDashboard', ccDashboard);
router.get('/cpDashboard', cpDashboard);
router.get('/itDashboard', itDashboard);
router.get('/rdDashboard', rdDashboard);
router.get('/ntDashboard', ntDashboard);
router.get('/ltDashboard', ltDashboard);
module.exports = router;
