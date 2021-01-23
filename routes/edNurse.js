const express = require('express');

const router = express.Router();

const {
  getLab,
  getRad,
  submitRequest,
  getHouskeepingRequests,
  getCustomerCareRequests,
  getNurseTechnicianRequests,
} = require('../controllers/edNurseRequests');

router.get('/getLab', getLab);
router.get('/getRad', getRad);
router.get('/getRad', getRad);
router.post('/submitRequest', submitRequest);

module.exports = router;
