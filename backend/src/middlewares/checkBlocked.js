const { AppError } = require('./errorHandler');

const checkBlocked = (req, res, next) => {
  if (req.user && req.user.status === 'blocked') {
    return next(new AppError('Your account has been blocked. Contact admin for support.', 403));
  }
  next();
};

module.exports = checkBlocked;
