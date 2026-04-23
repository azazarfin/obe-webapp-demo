const mongoose = require('mongoose');

const sectionCRSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  series: { type: Number, required: true },
  section: { type: String, required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // The advisor who assigned them
}, { timestamps: true });

// A student can only be a CR for a specific section once
sectionCRSchema.index({ student: 1, department: 1, series: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('SectionCR', sectionCRSchema);
