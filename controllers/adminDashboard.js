const moment = require('moment');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const ChiefComplaints = require('../models/chiefComplaint/chiefComplaint');
const CareStreams = require('../models/CareStreams/CareStreams');
const LabServices = require('../models/service/lab')

// Most Selected Chief Complaints
exports.chiefComplaints = asyncHandler(async (req, res) => {
    const sixHour = moment().subtract(6, 'hours').utc().toDate();
    // Patients who were assigned a chief complaint in the last 6 hours
    const assignedCareStreams = await EDR.aggregate([
        {
            $project: {
                chiefComplaint: 1
            },
        },
        {
            $unwind: '$chiefComplaint',
        },
        {
            $match: {
                $and: [
                    { 'chiefComplaint.assignedTime': { $gte: sixHour } }
                ],
            },
        },
    ]);
    // console.log("Chief Complaints assigned in last 6 hours : ", assignedCareStreams)
    const chiefComplaints = await ChiefComplaints.aggregate([
        {
            $match: {
                $and: [
                    { 'availability': true },
                    { 'disabled': false },
                ],
            },
        },
        {
            $project: {
                name: 1,
                chiefComplaintId: 1
            },
        },
    ])
    // console.log("Total Chief Complaints : ", chiefComplaints)
    for (let i = 0; i < chiefComplaints.length; i++) {
        if (assignedCareStreams.length > 0) {
            for (let j = 0; j < assignedCareStreams.length; j++) {
                if (chiefComplaints[i]._id.toString() === assignedCareStreams[j].chiefComplaint.chiefComplaintId.toString()) {
                    if (!chiefComplaints[i].selected) {
                        chiefComplaints[i].selected = 1
                    }
                    else {
                        chiefComplaints[i].selected++
                    }
                }
                else if (!chiefComplaints[i].selected) {
                    chiefComplaints[i].selected = 0
                }
            }
        }
        else {
            chiefComplaints[i].selected = 0
        }
    }
    // console.log("chief complaints data selected : ", chiefComplaints)
    res.status(200).json({
        success: true,
        data: chiefComplaints
    });
});

// Most Selected CareStreams
exports.careStreams = asyncHandler(async (req, res) => {
    const sixHour = moment().subtract(6, 'hours').utc().toDate();
    // Patients who were assigned a careStream in the last 6 hours
    const assignedCareStreams = await EDR.aggregate([
        {
            $project: {
                careStream: 1
            },
        },
        {
            $unwind: '$careStream',
        },
        {
            $match: {
                $and: [
                    { 'careStream.assignedTime': { $gte: sixHour } }
                ],
            },
        },
    ]);
    // console.log("careStream assigned in last 6 hours : ", assignedCareStreams)
    const careStreams = await CareStreams.aggregate([
        {
            $match: {
                $and: [
                    { 'disabled': false },
                ],
            },
        },
        {
            $project: {
                name: 1,
                identifier: 1
            },
        },
    ])
    // console.log("Total CareStreams : ", careStreams)
    for (let i = 0; i < careStreams.length; i++) {
        if (assignedCareStreams.length > 0) {
            for (let j = 0; j < assignedCareStreams.length; j++) {
                if (careStreams[i]._id.toString() === assignedCareStreams[j].careStream.careStreamId.toString()) {
                    if (!careStreams[i].selected) {
                        careStreams[i].selected = 1
                    }
                    else {
                        careStreams[i].selected++
                    }
                }
                else if (!careStreams[i].selected) {
                    careStreams[i].selected = 0
                }
            }
        }
        else {
            careStreams[i].selected = 0
        }
    }
    // console.log("chief complaints data selected : ", careStreams)
    res.status(200).json({
        success: true,
        data: careStreams
    });
});

// Most Requested Lab Tests
exports.labTests = asyncHandler(async (req, res) => {
    const sixHour = moment().subtract(6, 'hours').utc().toDate();
    // Patients who requested lab service in the last 6 hours
    const requestedLabReq = await EDR.aggregate([
        {
            $project: {
                labRequest: 1
            },
        },
        {
            $unwind: '$labRequest',
        },
        {
            $match: {
                $and: [
                    { 'labRequest.requestedAt': { $gte: sixHour } }
                ],
            },
        },
    ]);
    // console.log("services in last 6 hours : ", requestedLabReq)
    const labServices = await LabServices.aggregate([
        {
            $match: {
                $and: [
                    { 'disabled': false },
                ],
            },
        },
        {
            $project: {
                name: 1,
                identifier: 1,
                type: 1
            },
        },
    ])
    console.log("Total labServices : ", labServices)
    for (let i = 0; i < labServices.length; i++) {
        if (requestedLabReq.length > 0) {
            for (let j = 0; j < requestedLabReq.length; j++) {
                if (labServices[i]._id.toString() === requestedLabReq[j].labRequest.serviceId.toString()) {
                    if (!labServices[i].selected) {
                        labServices[i].selected = 1
                    }
                    else {
                        labServices[i].selected++
                    }
                }
                else if (!labServices[i].selected){
                    labServices[i].selected = 0
                }
            }
        }
        else {
            labServices[i].selected = 0
        }
    }
    // console.log("Lab services selected : ", labServices)
    res.status(200).json({
        success: true,
        data: labServices
    });
});