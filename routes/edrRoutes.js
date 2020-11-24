const express = require('express');
const { generateEDR, getEDR } = require('../controllers/edrController');

const router = express.Router();

router.route('/').post(generateEDR);
router.route('/:id').get(getEDR);

module.exports = router;
