const express = require('express');

const router = express.Router();

const { addLabService } = require('../controllers/labServiecController');

router.post('/addLabService', addLabService);

module.exports = router;
