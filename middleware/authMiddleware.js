// middleware/authMiddleware.js
const { verifyToken } = require('../helper/jwt');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  try {
    //Try reading from cookie first
    let token = req.cookies?.token;

    //Fallback: headers / body / query
    if (!token) {
      token =
        (req.headers && (req.headers['token'] || req.headers['authorization'] || req.headers['x-access-token'])) ||
        (req.body && req.body.token) ||
        (req.query && req.query.token);
    }

    //If still no token → reject
    if (!token) {
      return res.status(401).json({ message: 'Token not provided' });
    }

    //Clean "Bearer " prefix (if exists)
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    // Verify JWT
    const decoded = verifyToken(cleanToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    //Fetch user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    //Attach user object to req
    req.user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
