const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['CENTRAL_ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT'], 
    required: true 
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  rollNumber: { type: String },
  designation: { type: String },
  teacherType: {
    type: String,
    enum: ['Host', 'Guest'],
    default: 'Host'
  },
  onLeave: {
    type: Boolean,
    default: false
  },
  leaveReason: {
    type: String,
    trim: true,
    default: ''
  },
  series: { type: Number },
  section: { type: String }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
