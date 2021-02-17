const express = require('express');

const router = express.Router();

const { addShift, updateShift } = require('../controllers/shift');

router.post('/addShift', addShift);
router.put('/updateShift', updateShift);

module.exports = router;
