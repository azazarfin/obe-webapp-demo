const mongoose = require('mongoose');

const courseAdvisorSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  series: { type: Number, required: true },
  section: { type: String, required: true }
}, { timestamps: true });

// A teacher can only be an advisor for a specific section/series once
courseAdvisorSchema.index({ teacher: 1, department: 1, series: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('CourseAdvisor', courseAdvisorSchema);
