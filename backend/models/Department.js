const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  shortName: { type: String, required: true, unique: true },
  establishedYear: { type: Number },
  introduction: { type: String },
  hasSections: { type: Boolean, default: false },
  sectionCount: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
