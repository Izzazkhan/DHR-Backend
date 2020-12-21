const express = require('express');

const router = express.Router();

const {
  getAllCustomerCares,
  searchCustomerCare,
  assignCC,
} = require('../controllers/customerCareController');

router.get('/getAllCustomerCares', getAllCustomerCares);
router.get('/searchCustomerCare/:keyword', searchCustomerCare);
router.put('/assignCustomerCare', assignCC);

module.exports = router;
