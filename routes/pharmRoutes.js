const express = require('express');

const {
  createPharmRequest,
  getPharmRequest,
} = require('../controllers/pharmController');

const router = express.Router();
router.route('/').post(createPharmRequest).get(getPharmRequest);

module.exports = router;
