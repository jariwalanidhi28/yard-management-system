const mongoose = require('mongoose');
const { YARD_SLOT_TYPES, YARD_SLOT_STATUS } = require('../config/constants');

const yardSlotSchema = new mongoose.Schema(
  {
    slotCode: {
      type: String,
      required: [true, 'Slot code is required'],
      trim: true,
      uppercase: true,
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'YardZone',
      required: [true, 'Yard zone reference is required'],
    },
    slotType: {
      type: String,
      enum: YARD_SLOT_TYPES,
      default: 'Standard',
    },
    status: {
      type: String,
      enum: Object.values(YARD_SLOT_STATUS),
      default: YARD_SLOT_STATUS.AVAILABLE,
    },
    currentVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GateVisit',
      default: null,
    },
    currentVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
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

yardSlotSchema.index({ zone: 1, slotCode: 1 }, { unique: true });
yardSlotSchema.index({ status: 1 });
yardSlotSchema.index({ currentVisit: 1 });

module.exports = mongoose.model('YardSlot', yardSlotSchema);
