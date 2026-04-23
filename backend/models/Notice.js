const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Targeting ───
  scope: {
    type: String,
    enum: ['ALL', 'DEPARTMENT', 'COURSE'],
    required: true
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  classInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInstance' },

  // ─── Auto-notification metadata ───
  type: {
    type: String,
    enum: ['MANUAL', 'ASSESSMENT', 'FEEDBACK_OPEN', 'FEEDBACK_CLOSE', 'CR_GENERAL'],
    default: 'MANUAL'
  },
  relatedEntity: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

// Index for efficient querying by scope
noticeSchema.index({ scope: 1, createdAt: -1 });
noticeSchema.index({ department: 1, createdAt: -1 });
noticeSchema.index({ classInstance: 1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
