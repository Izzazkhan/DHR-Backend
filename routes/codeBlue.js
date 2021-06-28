const express = require('express');

const router = express.Router();

const {
  addCodeBlueTeam,
  getCodeBlueTeam,
  updateCodeBlueTeam,
  assignCodeBlueTeam,
  //   sendNotification,
} = require('../controllers/codeBlueTeam');

router.post('/addCodeBlueTeam', addCodeBlueTeam);
router.get('/getCodeBlueTeam', getCodeBlueTeam);
router.put('/updateCodeBlueTeam', updateCodeBlueTeam);
router.put('/assignCodeBlueTeam', assignCodeBlueTeam);
// router.get('/sendNotification/:teamId', sendNotification);

module.exports = router;
