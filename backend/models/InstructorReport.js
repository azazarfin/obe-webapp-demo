const mongoose = require('mongoose');

const instructorReportSchema = new mongoose.Schema({
  classInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInstance', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratings: [{
    attribute: { type: String, required: true },
    score: { type: Number, min: 1, max: 5, required: true }
  }],
  courseOutcomes: [{
    code: { type: String, required: true },       // e.g. "CO1"
    description: { type: String, default: '' }     // instructor-provided CO description
  }],
  suggestions: {
    syllabus: { type: String },
    teaching: { type: String },
    resources: { type: String },
    assessment: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('InstructorReport', instructorReportSchema);
