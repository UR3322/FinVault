const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;

    // prevent role/status manipulation
    delete req.body.role;
    delete req.body.status;
    delete req.body.email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    );

    sendSuccess(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/change-password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
