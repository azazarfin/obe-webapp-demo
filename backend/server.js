const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { verifyToken } = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('RUET OBE Evaluation System API');
});

// Routes
app.use('/api/auth', authRoutes);

// Example protected route to test middleware
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'Authenticated successfully', user: req.user });
});

mongoose.connect(process.env.MONGO_URI, { 
//   useNewUrlParser: true, // Deprecated in Mongoose 6+
//   useUnifiedTopology: true // Deprecated in Mongoose 6+
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
