const express = require('express');

const router = express.Router();

const { addShift, updateShift, getAllShifts } = require('../controllers/shift');

router.post('/addShift', addShift);
router.put('/updateShift', updateShift);
router.get('/getAllShifts', getAllShifts);
module.exports = router;
