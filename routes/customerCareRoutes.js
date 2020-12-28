const express = require('express');

const router = express.Router();

const {
  getAllCustomerCares,
  getCCStaffByKeyword,
  assignCC,
} = require('../controllers/customerCareController');

router.get('/getAllCustomerCares', getAllCustomerCares);
router.get('/searchCustomerCare/:keyword', getCCStaffByKeyword);
router.put('/assignCustomerCare', assignCC);

module.exports = router;
