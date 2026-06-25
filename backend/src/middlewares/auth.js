const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

// verify JWT and attach user to request
const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    // also check authorization header as fallback
    if (!token && req.headers.authorization) {
      if (req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
    }

    if (!token) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('Not authorized, token failed', 401));
  }
};

// check if user has admin role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(new AppError('Admin access only', 403));
  }
};

module.exports = { protect, adminOnly };
