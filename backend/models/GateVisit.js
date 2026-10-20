const mongoose = require('mongoose');
const { GATE_VISIT_STATUS, GATE_VISIT_PURPOSES } = require('../config/constants');

const gateVisitSchema = new mongoose.Schema(
  {
    gatePassNumber: {
      type: String,
      required: [true, 'Gate pass number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver reference is required'],
    },
    entryTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(GATE_VISIT_STATUS),
      default: GATE_VISIT_STATUS.INSIDE_YARD,
    },
    assignedSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'YardSlot',
      default: null,
    },
    shipmentReference: {
      type: String,
      trim: true,
      default: '',
    },
    purpose: {
      type: String,
      enum: GATE_VISIT_PURPOSES,
      default: 'Loading',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedByEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedByExit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

gateVisitSchema.index({ vehicle: 1, status: 1 });
gateVisitSchema.index({ driver: 1 });
gateVisitSchema.index({ entryTime: -1 });
gateVisitSchema.index({ exitTime: -1 });
gateVisitSchema.index({ status: 1 });

module.exports = mongoose.model('GateVisit', gateVisitSchema);
