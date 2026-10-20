const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ROLES } = require('../config/constants');

// @desc    Get all staff accounts
// @route   GET /api/v1/staff
// @access  Private (Admin)
const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single staff account
// @route   GET /api/v1/staff/:id
// @access  Private (Admin)
const getStaffById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('Staff user not found.', 404));
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create staff account
// @route   POST /api/v1/staff
// @access  Private (Admin)
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role = ROLES.STAFF } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff account (name, email, role, isActive)
// @route   PATCH /api/v1/staff/:id
// @access  Private (Admin)
const updateStaff = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('Staff user not found.', 404));
    }

    // Prevent admin from deactivating or demoting themselves
    if (req.user._id.toString() === user._id.toString()) {
      if (req.body.isActive === false) {
        return next(new AppError('You cannot deactivate your own administrative account.', 400));
      }
      if (req.body.role && req.body.role !== ROLES.ADMIN) {
        return next(new AppError('You cannot demote your own administrative account.', 400));
      }
    }

    if (req.body.email && req.body.email !== user.email) {
      const duplicate = await User.findOne({ email: req.body.email });
      if (duplicate) {
        return next(new AppError('An account with this email address already exists.', 409));
      }
      user.email = req.body.email;
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.role) user.role = req.body.role;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
    if (req.body.password) user.password = req.body.password;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Staff account updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete staff account
// @route   DELETE /api/v1/staff/:id
// @access  Private (Admin)
const deleteStaff = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return next(new AppError('You cannot delete your own administrative account.', 400));
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new AppError('Staff user not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Staff account deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
};
