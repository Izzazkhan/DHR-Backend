const express = require('express');

const router = express.Router();

const {
  getAllCustomerCares,
  getCCStaffByKeyword,
  assignCC,
  pendingEdToEouTransfers,
  pendingEouToEdTransfers,
  completeEDTransfer,
  completeEOUTransfer,
  completedEdToEouTransfers,
  completedEouToEdTransfers,
  pendingDischargeEdrs,
  completeDischarge,
  completedDischargeEdrs,
  getPendingSurveyEdrs,
  getCompletedSurveyEdrs,
  pendingMedications,
  completedMedications,
  updateMedicationStatus,
  pendingAmbulanceRequest,
  completedAmbulanceRequest,
  updateAmbulanceRequest,
} = require('../controllers/customerCareController');

router.get('/getAllCustomerCares', getAllCustomerCares);
router.get('/searchCustomerCare/:keyword', getCCStaffByKeyword);
router.put('/assignCustomerCare', assignCC);
router.put('/completeEOUTransfer/:transferId', completeEOUTransfer);
router.put('/completeEDTransfer/:transferId', completeEDTransfer);
router.get('/pendingEouTransfer/:ccId', pendingEdToEouTransfers);
router.get('/pendingEdTransfer/:ccId', pendingEouToEdTransfers);
router.get('/completedEouTransfer/:ccId', completedEdToEouTransfers);
router.get('/completedEdTransfer/:ccId', completedEouToEdTransfers);
router.get('/pendingDischargeEdrs/:ccId', pendingDischargeEdrs);
router.get('/completeDischarge/:dischargeId', completeDischarge);
router.get('/completedDischargeEdrs/:ccId', completedDischargeEdrs);
router.get('/pendingMedications/:ccId', pendingMedications);
router.get('/completedMedications/:ccId', completedMedications);
router.put('/updateMedicationStatus', updateMedicationStatus);
router.get('/getPendingSurveyEdrs', getPendingSurveyEdrs);
router.get('/getCompletedSurveyEdrs', getCompletedSurveyEdrs);
router.get('/pendingAmbulanceRequest/:ccId', pendingAmbulanceRequest);
router.get('/completedAmbulanceRequest/:ccId', completedAmbulanceRequest);
router.put('/updateAmbulanceRequest', updateAmbulanceRequest);
module.exports = router;
