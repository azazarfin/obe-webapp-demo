const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, unique: true },
  courseName: { type: String, required: true },
  credit: { type: Number, required: true },
  semester: { type: String },
  type: { 
    type: String, 
    enum: ['Theory', 'Sessional'], 
    required: true 
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  syllabus: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
