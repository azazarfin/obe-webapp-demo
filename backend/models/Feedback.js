const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  classInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInstance', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ratings: [{
    attribute: { type: String, required: true },
    score: { type: Number, min: 1, max: 5, required: true }
  }],
  suggestions: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
