const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  classInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInstance', required: true },
  title: { type: String, required: true }, // e.g., "CT-1", "Final-Q1a"
  type: { 
    type: String, 
    enum: ['CT', 'Assignment', 'Final', 'Quiz', 'Report', 'LabFinal'], 
    required: true 
  },
  totalMarks: { type: Number, required: true },
  mappedCO: { type: String } // e.g., "CO1", can be array if mapped to multiple, but schema says mappedCO (String)
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
