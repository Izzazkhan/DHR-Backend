const express = require('express');

const router = express.Router();

const { addCareStream } = require('../controllers/careStreamController');

router.post('/addCareStream', addCareStream);

module.exports = router;
