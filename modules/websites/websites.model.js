const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  site: { type: String, unique: true },
  emails: [String],
  phones: [String],
  whatsapp: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Website', websiteSchema);