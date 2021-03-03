const express = require('express');

const router = express.Router();

const {
  addCodeBlueTeam,
  getCodeBlueTeam,
  updateCodeBlueTeam,
} = require('../controllers/codeBlueTeam');

router.post('/addCodeBlueTeam', addCodeBlueTeam);
router.get('/getCodeBlueTeam', getCodeBlueTeam);
router.put('/updateCodeBlueTeam', updateCodeBlueTeam);

module.exports = router;
