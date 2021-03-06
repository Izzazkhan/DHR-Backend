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
  getAllReconciliationNotes,
  completeReconciliationNotes,
  addReconciliationNotes,
  updateReconciliationNotes,
} = require('../controllers/reconciliationNotesController');

const router = express.Router();

router.get(
  '/getAllPendingConsultationNotes/:id',
  getAllPendingConsultationNotes
);

router.get('/getAllReconciliationNotes', getAllReconciliationNotes);

router.put(
  '/addReconciliationNotes',
  upload.single('file'),
  addReconciliationNotes
);

router.put(
  '/updateReconciliationNotes',
  upload.single('file'),
  updateReconciliationNotes
);

router.put(
  '/completeReconciliationNotes',
  upload.single('file'),
  completeReconciliationNotes
);

module.exports = router;
