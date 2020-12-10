const express = require('express');
const {
  generateEDR,
  getEDRs,
  getEDRById,
} = require('../controllers/edrController');

const router = express.Router();

router.route('/').post(generateEDR).get(getEDRs);
router.route('/:id').get(getEDRById);

module.exports = router;
