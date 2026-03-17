const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['CENTRAL_ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT'], 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        if (this.role === 'STUDENT') {
          return /^[\w-\.]+@student\.ruet\.ac\.bd$/.test(v);
        }
        return /^[\w-\.]+@[\w-\.]+\.+[\w-]{2,4}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  profileRef: { 
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'profileModel'
  },
  profileModel: {
    type: String,
    enum: ['Student', 'Teacher', null],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
