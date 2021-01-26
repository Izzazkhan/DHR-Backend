const express = require('express');

const router = express.Router();

const {
  getAllCustomerCares,
  getCCStaffByKeyword,
  assignCC,
  pendingEdToEouTransfers,
} = require('../controllers/customerCareController');

router.get('/getAllCustomerCares', getAllCustomerCares);
router.get('/searchCustomerCare/:keyword', getCCStaffByKeyword);
router.put('/assignCustomerCare', assignCC);
router.get('/pendingEouTransfer/:ccId', pendingEdToEouTransfers);

module.exports = router;
