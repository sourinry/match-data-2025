// helpers/jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Generate token
const generateToken = (payload, expiresIn = '1d') => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
