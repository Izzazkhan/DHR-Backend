const express = require('express');

const router = express.Router();

const {
    dashboard,
    chiefComplaints,
    careStreams,
    medication,
    labTests,
    radiologyExams
} = require('../controllers/adminDashboard');

// Admin dashboard API Routes
router.get('/dashboard', dashboard);
router.get('/chiefComplaints', chiefComplaints);
router.get('/careStreams', careStreams);
router.get('/medication', medication);
router.get('/labTests', labTests);
router.get('/radiologyExams', radiologyExams);

module.exports = router;