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
} = require('../controllers/customerCareController');

router.get('/getAllCustomerCares', getAllCustomerCares);
router.get('/searchCustomerCare/:keyword', getCCStaffByKeyword);
router.put('/assignCustomerCare', assignCC);
router.get('/completeTransfer/:transferId', completeTransfer);
router.get('/pendingEouTransfer/:ccId', pendingEdToEouTransfers);
router.get('/completedEouTransfer/:ccId', completedEdToEouTransfers);
router.get('/pendingDischargeEdrs/:ccId', pendingDischargeEdrs);

module.exports = router;
