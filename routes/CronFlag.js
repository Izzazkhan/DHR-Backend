const express = require('express');

const router = express.Router();

const { addFlag } = require('../controllers/cronFlag');

router.post('/addFlag', addFlag);

module.exports = router;
