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
} = require('../controllers/customerCareController');

router.get('/getAllCustomerCares', getAllCustomerCares);
router.get('/searchCustomerCare/:keyword', getCCStaffByKeyword);
router.put('/assignCustomerCare', assignCC);
router.get('/completeEOUTransfer/:transferId', completeEOUTransfer);
router.get('/completeEDTransfer/:transferId', completeEDTransfer);
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

module.exports = router;
