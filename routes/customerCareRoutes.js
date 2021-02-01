const express = require('express');

const router = express.Router();

const {
  getAllCustomerCares,
  getCCStaffByKeyword,
  assignCC,
  pendingEdToEouTransfers,
  completeTransfer,
  completedEdToEouTransfers,
  pendingDischargeEdrs,
  completeDischarge,
  completedDischargeEdrs,
  getPendingSurveyEdrs,
  getCompletedSurveyEdrs,
  pendingMedications,
} = require('../controllers/customerCareController');

router.get('/getAllCustomerCares', getAllCustomerCares);
router.get('/searchCustomerCare/:keyword', getCCStaffByKeyword);
router.put('/assignCustomerCare', assignCC);
router.get('/completeTransfer/:transferId', completeTransfer);
router.get('/pendingEouTransfer/:ccId', pendingEdToEouTransfers);
router.get('/completedEouTransfer/:ccId', completedEdToEouTransfers);
router.get('/pendingDischargeEdrs/:ccId', pendingDischargeEdrs);
router.get('/completeDischarge/:dischargeId', completeDischarge);
router.get('/completedDischargeEdrs/:ccId', completedDischargeEdrs);
router.get('/pendingMedications/:ccId', pendingMedications);
router.get('/getPendingSurveyEdrs', getPendingSurveyEdrs);
router.get('/getCompletedSurveyEdrs', getCompletedSurveyEdrs);

module.exports = router;
