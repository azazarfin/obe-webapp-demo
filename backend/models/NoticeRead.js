const mongoose = require('mongoose');

const noticeReadSchema = new mongoose.Schema({
  notice: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, default: Date.now }
});

// Prevent duplicate read entries
noticeReadSchema.index({ notice: 1, user: 1 }, { unique: true });
// Fast lookup for "all notices read by user"
noticeReadSchema.index({ user: 1 });

module.exports = mongoose.model('NoticeRead', noticeReadSchema);
