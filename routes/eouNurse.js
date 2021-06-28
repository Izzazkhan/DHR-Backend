const express = require('express');

const router = express.Router();

const {
  pendingEOUNurseEdrRequest,
  completeRequest,
  completedEOUNurseEdrRequest,
  dashboardData,
  getEOUNursePatients,
} = require('../controllers/eouNurseRequests');

router.get('/pendingEOUNurseEdrRequest/:nurseId', pendingEOUNurseEdrRequest);
router.put('/completeRequest', completeRequest);
router.get(
  '/completedEOUNurseEdrRequest/:nurseId',
  completedEOUNurseEdrRequest
);
router.get('/getDashboardData/:nurseId', dashboardData);
router.get('/getEOUNursePatients/:nurseId', getEOUNursePatients);

module.exports = router;
