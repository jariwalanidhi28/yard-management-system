const mongoose = require('mongoose');
const { YARD_MOVEMENT_ACTIONS } = require('../config/constants');

const yardMovementSchema = new mongoose.Schema(
  {
    gateVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GateVisit',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(YARD_MOVEMENT_ACTIONS),
      required: true,
    },
    fromSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'YardSlot',
      default: null,
    },
    toSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'YardSlot',
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

yardMovementSchema.index({ gateVisit: 1 });
yardMovementSchema.index({ vehicle: 1 });
yardMovementSchema.index({ timestamp: -1 });

module.exports = mongoose.model('YardMovement', yardMovementSchema);
