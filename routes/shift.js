const express = require('express');

const router = express.Router();

const { addShift } = require('../controllers/shift');

router.post('/addShift', addShift);

module.exports = router;
