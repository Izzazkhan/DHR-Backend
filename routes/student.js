const express = require('express');

const router = express.Router();

const {
  addStudent,
  getStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

router.post('/addStudent', addStudent);
router.get('/getStudent', getStudent);
router.put('/updateStudent', updateStudent);
router.delete('/deleteStudent/:id', deleteStudent);

module.exports = router;
