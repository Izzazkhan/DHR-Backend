const express = require('express');

const router = express.Router();

const { createEOU, createBed } = require('../controllers/EOU');

router.post('/createEou', createEOU);
router.post('/createBed', createBed);

module.exports = router;
