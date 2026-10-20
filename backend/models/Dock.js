const mongoose = require('mongoose');
const { DOCK_TYPES, DOCK_STATUS } = require('../config/constants');

const dockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dock name is required'],
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: [true, 'Unique dock code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    dockType: {
      type: String,
      enum: DOCK_TYPES,
      default: 'Dual',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(DOCK_STATUS),
      default: DOCK_STATUS.ACTIVE,
    },
    operationalHours: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '22:00' },
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

dockSchema.index({ status: 1 });

module.exports = mongoose.model('Dock', dockSchema);
