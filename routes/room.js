const express = require('express');
const { 
    createRoom,
    getRooms 
} = require('../controllers/room');
const router = express.Router();
router.get('/getRooms',getRooms)
router.post('/createRoom',createRoom)

module.exports = router;
