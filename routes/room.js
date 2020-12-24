const express = require('express');
const {
  getRooms,
  getAvailableRooms,
  createRoom,
  disableRoom,
  enableRoom,
  assignRoom,
} = require('../controllers/room');

const router = express.Router();
router.get('/getRooms', getRooms);
router.get('/getAvailableRooms', getAvailableRooms);
router.post('/createRoom', createRoom);
router.put('/disableRoom/:id', disableRoom);
router.put('/enableRoom/:id', enableRoom);
router.put('/assignRoom', assignRoom);

module.exports = router;
