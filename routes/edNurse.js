const express = require('express');

const router = express.Router();

const {
  getLab,
  getRad,
  getPharmacy,
  submitRequest,
  updateSubmitRequest,
  getHouskeepingRequests,
  getHouskeepingRequestsById,
  getCustomerCareRequests,
  getCustomerCareRequestsById,
  getNurseTechnicianRequests,
  getNurseTechnicianRequestsById,
  pendingEDNurseEdrRequest,
  completeRequest,
  completedEDNurseEdrRequest,
  updateMedicationStatus,
  dashboardData,
  searchGetPharmacy,
  pendingHKRequests,
  completedHKRequests,
  updateStatus,
} = require('../controllers/edNurseRequests');

router.get('/getLab', getLab);
router.get('/getRad', getRad);
router.get('/getPharmacy', getPharmacy);
router.get('/searchGetPharmacy/:keyword', searchGetPharmacy);
router.get('/getHKRequests', getHouskeepingRequests);
router.get('/getHKRequestsById/:staffId', getHouskeepingRequestsById);
router.get('/getCCRequests', getCustomerCareRequests);
router.get('/getCCRequestsById/:staffId', getCustomerCareRequestsById);
router.get('/getNTRequests', getNurseTechnicianRequests);
router.get('/getNTRequestsById/:staffId', getNurseTechnicianRequestsById);
router.post('/submitRequest', submitRequest);
router.put('/updateSubmitRequest', updateSubmitRequest);
router.get('/pendingEDNurseEdrRequest/:nurseId', pendingEDNurseEdrRequest);
router.put('/completeRequest', completeRequest);
router.put('/updateMedicationStatus', updateMedicationStatus);
router.get('/completedEDNurseEdrRequest/:nurseId', completedEDNurseEdrRequest);
router.get('/getDashboardData/:nurseId', dashboardData);
router.get('/pendingHKRequests/:nurseId', pendingHKRequests);
router.get('/completedHKRequests/:nurseId', completedHKRequests);
router.put('/updateStatus', updateStatus);

module.exports = router;
