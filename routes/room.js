const express = require('express');
const { 
    getRooms,
    getAvailableRooms,
    createRoom,
    disableRoom,
    enableRoom
} = require('../controllers/room');
const router = express.Router();
router.get('/getRooms',getRooms)
router.get('/getAvailableRooms',getAvailableRooms)
router.post('/createRoom',createRoom)
router.put('/disableRoom/:id',disableRoom)
router.put('/enableRoom/:id',enableRoom)

module.exports = router;
