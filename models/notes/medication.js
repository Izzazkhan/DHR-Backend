const mongoose = require("mongoose");

const medicaionNotesSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: "patinetFHIR",
  },
  medicineName: {
    type: String,
  },
  duration: {
    type: String,
  },
  dosage: {
    type: String,
  },
  additionalNotes: {
    type: String,
  },
  frequency: {
    type: String,
  },
});

module.exports = mongoose.model("pharmaNotes", medicaionNotesSchema);
