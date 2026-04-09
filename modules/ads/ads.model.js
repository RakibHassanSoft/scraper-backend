const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    url: {
        type: String,
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Ad', adSchema);