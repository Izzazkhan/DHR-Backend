const express = require('express');

const router = express.Router();

const {
  addCodeBlueTeam,
  getCodeBlueTeam,
  updateCodeBlueTeam,
  assignCodeBlueTeam,
} = require('../controllers/codeBlueTeam');

router.post('/addCodeBlueTeam', addCodeBlueTeam);
router.get('/getCodeBlueTeam', getCodeBlueTeam);
router.put('/updateCodeBlueTeam', updateCodeBlueTeam);
router.put('/assignCodeBlueTeam', assignCodeBlueTeam);

module.exports = router;
