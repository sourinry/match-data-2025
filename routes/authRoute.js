const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { generateToken, verifyToken } = require('../helper/jwt');

// ------------------------
// REGISTER
// ------------------------
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const userExist = await User.findOne({ username });
    if (userExist) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, password });
    await user.save();

    const token = generateToken({ id: user._id });

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,  // set true in production with HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// LOGIN
// ------------------------
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user._id });

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // set true when using HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      message: 'Login successful',
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// LOGOUT
// ------------------------
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// GET CURRENT USER (/me)
// ------------------------
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid token' });

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
