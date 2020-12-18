const express = require('express');

const router = express.Router();

const {
  getAllCustomerCares,
  searchCustomerCare,
} = require('../controllers/customerCareController');

router.get('/getAllCustomerCares', getAllCustomerCares);
router.get('/searchCustomerCare/:keyword', searchCustomerCare);

module.exports = router;
