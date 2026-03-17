const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// GET /api/auth/me
// Returns the currently authenticated user's profile and role from MongoDB
router.get('/me', verifyToken, async (req, res) => {
  try {
    // req.user is set by verifyToken (from Firebase)
    const uid = req.user.uid;
    
    // Find the user in MongoDB
    const user = await User.findOne({ uid }).select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found in database. Please contact admin.' });
    }

    res.json({
      uid: user.uid,
      email: user.email,
      role: user.role,
      profileModel: user.profileModel
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

module.exports = router;
