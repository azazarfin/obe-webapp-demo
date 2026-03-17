const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencing User for student
  classInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInstance', required: true },
  attendanceRecord: [{
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true }
  }],
  marks: [{
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    rawScore: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
