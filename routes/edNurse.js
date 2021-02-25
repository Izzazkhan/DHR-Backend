const express = require('express');

const router = express.Router();

const {
  getLab,
  getRad,
  getPharmacy,
  submitRequest,
  updateSubmitRequest,
  getHouskeepingRequests,
  getCustomerCareRequests,
  getNurseTechnicianRequests,
  pendingEDNurseEdrRequest,
  completeRequest,
  completedEDNurseEdrRequest,
  updateMedicationStatus,
  dashboardData
} = require('../controllers/edNurseRequests');

router.get('/getLab', getLab);
router.get('/getRad', getRad);
router.get('/getPharmacy', getPharmacy);
router.get('/getHKRequests', getHouskeepingRequests);
router.get('/getCCRequests', getCustomerCareRequests);
router.get('/getNTRequests', getNurseTechnicianRequests);
router.post('/submitRequest', submitRequest);
router.put('/updateSubmitRequest', updateSubmitRequest);
router.get('/pendingEDNurseEdrRequest/:nurseId', pendingEDNurseEdrRequest);
router.put('/completeRequest', completeRequest);
router.put('/updateMedicationStatus', updateMedicationStatus);
router.get('/completedEDNurseEdrRequest/:nurseId', completedEDNurseEdrRequest);
router.get('/getDashboardData/:nurseId', dashboardData);

module.exports = router;
