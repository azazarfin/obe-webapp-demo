const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencing User for student
  classInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInstance', required: true },
  type: {
    type: String,
    enum: ['regular', 'irregular'],
    default: 'regular'
  },
  status: {
    type: String,
    enum: ['active', 'hidden'],
    default: 'active'
  },
  attendanceRecord: [{
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  marks: [{
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    rawScore: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
