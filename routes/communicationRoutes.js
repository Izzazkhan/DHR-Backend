const express = require('express');

const router = express.Router();

const {
  addCommunicationRequest,
  getAllCommunicationRequests,
} = require('../controllers/communicationController');

router.post('/addCommunicationRequest', addCommunicationRequest);
router.get('/getAllCommunicationRequests', getAllCommunicationRequests);

module.exports = router;
