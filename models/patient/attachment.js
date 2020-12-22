const attachment = {
  contentType: { type: String },
  language: {
    type: String,
    // equilent to codeableconcept
  },
  data: { type: String },
  url: { type: String },
  size: { type: String },
  hash: { type: String },
  title: { type: String },
  creation: { type: String },
};

module.exports = { attachment };
