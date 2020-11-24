const mongoose = require("mongoose");

const CustomerSurveySchema = new mongoose.Schema({
  survey: [
    {
      question: {
        type: String,
      },
      answer: {
        type: String,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CustomerSurvey", CustomerSurveySchema);
