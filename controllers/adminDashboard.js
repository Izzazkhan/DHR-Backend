const moment = require('moment');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const ChiefComplaints = require('../models/chiefComplaint/chiefComplaint');
const CareStreams = require('../models/CareStreams/CareStreams');
const LabServices = require('../models/service/lab')
const RadServices = require('../models/service/radiology')
const Item = require('../models/item')
const Vendor = require('../models/vendor')

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
            $match: { 'chiefComplaint.assignedTime': { $gte: sixHour } }
        },
    ]);
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
            $match: { 'careStream.assignedTime': { $gte: sixHour } }
        },
    ]);
    const careStreams = await CareStreams.aggregate([
        {
            $match: { 'disabled': false },
        },
        {
            $project: {
                name: 1,
                identifier: 1
            },
        },
    ])
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
            $match: { 'labRequest.requestedAt': { $gte: sixHour } }
        },
    ]);
    const labServices = await LabServices.aggregate([
        {
            $match: { 'disabled': false },
        },
        {
            $project: {
                name: 1,
                identifier: 1,
                type: 1
            },
        },
    ])
    for (let i = 0; i < labServices.length; i++) {
        labServices[i].lastRequested = ''
        if (requestedLabReq.length > 0) {
            for (let j = 0; j < requestedLabReq.length; j++) {
                if (labServices[i]._id.toString() === requestedLabReq[j].labRequest.serviceId.toString()) {
                    if (!labServices[i].selected) {
                        labServices[i].selected = 1
                    }
                    else {
                        labServices[i].selected++
                    }
                    if (labServices[i].lastRequested = '') {
                        labServices[i].lastRequested = requestedLabReq[j].labRequest.requestedAt
                    }
                    else if (labServices[i].lastRequested <= requestedLabReq[j].labRequest.requestedAt) {
                        labServices[i].lastRequested = requestedLabReq[j].labRequest.requestedAt
                    }
                }
                else if (!labServices[i].selected) {
                    labServices[i].selected = 0
                }
            }
        }
        else {
            labServices[i].selected = 0
        }
    }
    res.status(200).json({
        success: true,
        data: labServices
    });
});

// Most Requested Rad Tests
exports.radiologyExams = asyncHandler(async (req, res) => {
    const sixHour = moment().subtract(6, 'hours').utc().toDate();
    // Patients who requested rad service in the last 6 hours
    const requestedRadReq = await EDR.aggregate([
        {
            $project: {
                radRequest: 1
            },
        },
        {
            $unwind: '$radRequest',
        },
        {
            $match: { 'radRequest.requestedAt': { $gte: sixHour } }
        },
    ]);
    const radServices = await RadServices.aggregate([
        {
            $match: { 'disabled': false },
        },
        {
            $project: {
                name: 1,
                identifier: 1,
                type: 1
            },
        },
    ])
    for (let i = 0; i < radServices.length; i++) {
        radServices[i].lastRequested = ''
        if (requestedRadReq.length > 0) {
            for (let j = 0; j < requestedRadReq.length; j++) {
                if (radServices[i]._id.toString() === requestedRadReq[j].radRequest.serviceId.toString()) {
                    if (!radServices[i].selected) {
                        radServices[i].selected = 1
                    }
                    else {
                        radServices[i].selected++
                    }
                    if (radServices[i].lastRequested = '') {
                        radServices[i].lastRequested = requestedRadReq[j].radRequest.requestedAt
                    }
                    else if (radServices[i].lastRequested <= requestedRadReq[j].radRequest.requestedAt) {
                        radServices[i].lastRequested = requestedRadReq[j].radRequest.requestedAt
                    }
                }
                else if (!radServices[i].selected) {
                    radServices[i].selected = 0
                }
            }
        }
        else {
            radServices[i].selected = 0
        }
    }
    res.status(200).json({
        success: true,
        data: radServices
    });
});

// Most Requested Medication
exports.medication = asyncHandler(async (req, res) => {
    const sixHour = moment().subtract(6, 'hours').utc().toDate();
    // Patients who requested medicines in the last 6 hours
    const requestedPharmas = await EDR.aggregate([
        {
            $project: {
                pharmacyRequest: 1
            },
        },
        {
            $unwind: '$pharmacyRequest',
        },
        {
            $match: { 'pharmacyRequest.createdAt': { $gte: sixHour } }
        },
    ]);
    const items = await Item.aggregate([
        {
            $match: { 'cls': 'Medical' }
        },
        {
            $project: {
                name: 1,
                itemCode: 1,
                medClass: 1,
                scientificName: 1,
                vendorId: 1
            },
        }
    ])
    const vendorItems = await Item.populate(items, [
        {
            path: 'vendorId',
            model: 'Vendor',
            select: 'englishName',
        }
    ]);

    for (let i = 0; i < vendorItems.length; i++) {
        if (requestedPharmas.length > 0) {
            for (let j = 0; j < requestedPharmas.length; j++) {
                let items = requestedPharmas[j].pharmacyRequest.item

                for (let k = 0; k < items.length; k++) {
                    if (vendorItems[i]._id.toString() === items[k].itemId.toString()) {
                        if (!vendorItems[i].selected) {
                            vendorItems[i].selected = 1
                        }
                        else {
                            vendorItems[i].selected++
                        }
                    }
                    else if (!vendorItems[i].selected) {
                        vendorItems[i].selected = 0
                    }
                }
            }
        }
        else {
            vendorItems[i].selected = 0
        }
    }
    res.status(200).json({
        success: true,
        data: vendorItems
    });
});

// Dashboard Comulative Data.
exports.dashboard = asyncHandler(async (req, res) => {
    const sixHour = moment().subtract(6, 'hours').utc().toDate();
    // Patients who were assigned a chief complaint in the last 6 hours
    const assignedChiefComplaints = await EDR.aggregate([
        {
            $project: {
                chiefComplaint: 1
            },
        },
        {
            $unwind: '$chiefComplaint',
        },
        {
            $match: { 'chiefComplaint.assignedTime': { $gte: sixHour } }
        },
    ]);
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
    for (let i = 0; i < chiefComplaints.length; i++) {
        if (assignedChiefComplaints.length > 0) {
            for (let j = 0; j < assignedChiefComplaints.length; j++) {
                if (chiefComplaints[i]._id.toString() === assignedChiefComplaints[j].chiefComplaint.chiefComplaintId.toString()) {
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
    let totalCC = 0
    chiefComplaints.map((d) => {
        totalCC += d.selected
    })

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
            $match: { 'careStream.assignedTime': { $gte: sixHour } }
        },
    ]);
    const careStreams = await CareStreams.aggregate([
        {
            $match: { 'disabled': false },
        },
        {
            $project: {
                name: 1,
                identifier: 1
            },
        },
    ])
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
    let totalCS = 0
    careStreams.map((d) => {
        totalCS += d.selected
    })

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
            $match: { 'labRequest.requestedAt': { $gte: sixHour } }
        },
    ]);
    const labServices = await LabServices.aggregate([
        {
            $match: { 'disabled': false },
        },
        {
            $project: {
                name: 1,
                identifier: 1,
                type: 1
            },
        },
    ])
    for (let i = 0; i < labServices.length; i++) {
        labServices[i].lastRequested = ''
        if (requestedLabReq.length > 0) {
            for (let j = 0; j < requestedLabReq.length; j++) {
                if (labServices[i]._id.toString() === requestedLabReq[j].labRequest.serviceId.toString()) {
                    if (!labServices[i].selected) {
                        labServices[i].selected = 1
                    }
                    else {
                        labServices[i].selected++
                    }
                    if (labServices[i].lastRequested = '') {
                        labServices[i].lastRequested = requestedLabReq[j].labRequest.requestedAt
                    }
                    else if (labServices[i].lastRequested <= requestedLabReq[j].labRequest.requestedAt) {
                        labServices[i].lastRequested = requestedLabReq[j].labRequest.requestedAt
                    }
                }
                else if (!labServices[i].selected) {
                    labServices[i].selected = 0
                }
            }
        }
        else {
            labServices[i].selected = 0
        }
    }
    let totalLabServices = 0
    labServices.map((d) => {
        totalLabServices += d.selected
    })

    // Patients who requested rad service in the last 6 hours
    const requestedRadReq = await EDR.aggregate([
        {
            $project: {
                radRequest: 1
            },
        },
        {
            $unwind: '$radRequest',
        },
        {
            $match: { 'radRequest.requestedAt': { $gte: sixHour } }
        },
    ]);
    const radServices = await RadServices.aggregate([
        {
            $match: { 'disabled': false },
        },
        {
            $project: {
                name: 1,
                identifier: 1,
                type: 1
            },
        },
    ])
    for (let i = 0; i < radServices.length; i++) {
        radServices[i].lastRequested = ''
        if (requestedRadReq.length > 0) {
            for (let j = 0; j < requestedRadReq.length; j++) {
                if (radServices[i]._id.toString() === requestedRadReq[j].radRequest.serviceId.toString()) {
                    if (!radServices[i].selected) {
                        radServices[i].selected = 1
                    }
                    else {
                        radServices[i].selected++
                    }
                    if (radServices[i].lastRequested = '') {
                        radServices[i].lastRequested = requestedRadReq[j].radRequest.requestedAt
                    }
                    else if (radServices[i].lastRequested <= requestedRadReq[j].radRequest.requestedAt) {
                        radServices[i].lastRequested = requestedRadReq[j].radRequest.requestedAt
                    }
                }
                else if (!radServices[i].selected) {
                    radServices[i].selected = 0
                }
            }
        }
        else {
            radServices[i].selected = 0
        }
    }
    let totalRadServices = 0
    radServices.map((d) => {
        totalRadServices += d.selected
    })

    // Patients who requested medicines in the last 6 hours
    const requestedPharmas = await EDR.aggregate([
        {
            $project: {
                pharmacyRequest: 1
            },
        },
        {
            $unwind: '$pharmacyRequest',
        },
        {
            $match: { 'pharmacyRequest.createdAt': { $gte: sixHour } }
        },
    ]);
    const items = await Item.aggregate([
        {
            $match: { 'cls': 'Medical' }
        },
        {
            $project: {
                name: 1,
                itemCode: 1,
                medClass: 1,
                scientificName: 1,
                vendorId: 1
            },
        }
    ])
    const vendorItems = await Item.populate(items, [
        {
            path: 'vendorId',
            model: 'Vendor',
            select: 'englishName',
        }
    ]);

    for (let i = 0; i < vendorItems.length; i++) {
        if (requestedPharmas.length > 0) {
            for (let j = 0; j < requestedPharmas.length; j++) {
                let items = requestedPharmas[j].pharmacyRequest.item

                for (let k = 0; k < items.length; k++) {
                    if (vendorItems[i]._id.toString() === items[k].itemId.toString()) {
                        if (!vendorItems[i].selected) {
                            vendorItems[i].selected = 1
                        }
                        else {
                            vendorItems[i].selected++
                        }
                    }
                    else if (!vendorItems[i].selected) {
                        vendorItems[i].selected = 0
                    }
                }
            }
        }
        else {
            vendorItems[i].selected = 0
        }
    }
    let totalMedication = 0
    vendorItems.map((d) => {
        totalMedication += d.selected
    })

    res.status(200).json({
        success: true,
        data: {
            totalCC,
            totalCS,
            totalLabServices,
            totalRadServices,
            totalMedication
        }
    });
});