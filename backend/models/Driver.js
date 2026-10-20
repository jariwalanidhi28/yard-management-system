const mongoose = require('mongoose');
const { DRIVER_STATUS } = require('../config/constants');

const driverSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 120,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    licenseNumber: {
      type: String,
      required: [true, 'Driving license number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: [DRIVER_STATUS.ACTIVE, DRIVER_STATUS.INACTIVE],
      default: DRIVER_STATUS.ACTIVE,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

driverSchema.index({ status: 1 });
driverSchema.index({ licenseExpiryDate: 1 });

module.exports = mongoose.model('Driver', driverSchema);
