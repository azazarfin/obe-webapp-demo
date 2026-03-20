const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
  year: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Series', seriesSchema);
