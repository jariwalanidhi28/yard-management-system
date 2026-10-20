const mongoose = require('mongoose');
const { SHIPMENT_STATUS } = require('../config/constants');

const shipmentEventSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SHIPMENT_STATUS),
      required: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Yard Facility',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
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

shipmentEventSchema.index({ shipment: 1, timestamp: -1 });

module.exports = mongoose.model('ShipmentEvent', shipmentEventSchema);
