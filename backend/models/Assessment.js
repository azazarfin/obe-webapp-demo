const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  classInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInstance', required: true },
  title: { type: String, required: true }, // e.g., "CT-1", "Final-Q1a"
  type: { 
    type: String, 
    enum: ['CT', 'Assignment', 'Final', 'Quiz', 'Report', 'LabFinal', 'Presentation', 'Viva', 'Custom'], 
    required: true 
  },
  totalMarks: { type: Number, required: true },
  mappedCO: { type: String },
  mappedPOs: {
    type: [String],
    default: []
  },
  typeLabel: { type: String },
  assessmentDate: { type: Date },
  finalPart: {
    type: String,
    enum: ['A', 'B'],
    default: undefined
  },
  questionNo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
