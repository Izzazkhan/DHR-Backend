const express = require('express');
const multer = require('multer');

const PATH = './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PATH);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname
    );
  },
});

const upload = multer({ storage: storage });
const {
  getAllPendingConsultationNotes,
  getAllCompletedConsultationNotes,
  completeConsultationNotes,
} = require('../controllers/consultationNotesController');

const router = express.Router();

router.get(
  '/getAllPendingConsultationNotes/:id',
  getAllPendingConsultationNotes
);

router.get(
  '/getAllCompletedConsultationNotes/:id',
  getAllCompletedConsultationNotes
);

router.put(
  '/completeConsultationNotes',
  upload.single('file'),
  completeConsultationNotes
);

module.exports = router;
