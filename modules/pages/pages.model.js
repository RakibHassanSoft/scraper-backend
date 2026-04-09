const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  facebookUrl: { type: String, unique: true },
  website: [String],
  socialMedia: [String],
  emails: [String],
  phones: [String],
  whatsapp: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Page', pageSchema);