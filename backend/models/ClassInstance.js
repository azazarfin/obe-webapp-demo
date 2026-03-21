const mongoose = require('mongoose');

const classInstanceSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  series: { type: Number, required: true }, // e.g., 2023
  section: { 
    type: String, 
    enum: ['N/A', 'A', 'B', 'C', 'D', 'E'], 
    default: 'N/A' 
  },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencing User for teacher
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: { 
    type: String, 
    enum: ['Running', 'Finished'], 
    default: 'Running' 
  },
  coPoMapping: [{
    co: { type: String, required: true }, // e.g., "CO1"
    po: [{ type: String, required: true }] // e.g., ["PO1", "PO2"]
  }],
  feedbackQuestions: {
    type: [String],
    default: []
  },
  feedbackPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

classInstanceSchema.pre('save', function(next) {
  if (Array.isArray(this.teachers) && this.teachers.length > 0) {
    this.teacher = this.teachers[0];
  }
  next();
});

module.exports = mongoose.model('ClassInstance', classInstanceSchema);
