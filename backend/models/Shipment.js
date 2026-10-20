const mongoose = require('mongoose');
const { SHIPMENT_STATUS, SHIPMENT_WEIGHT_UNITS } = require('../config/constants');

const shipmentSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      required: [true, 'Tracking number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    orderNumber: {
      type: String,
      required: [true, 'Order or reference number is required'],
      trim: true,
      uppercase: true,
    },
    consignee: {
      type: String,
      required: [true, 'Consignee or customer name is required'],
      trim: true,
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0, 'Weight must be non-negative'],
    },
    weightUnit: {
      type: String,
      enum: SHIPMENT_WEIGHT_UNITS,
      default: 'Kg',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    gateVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GateVisit',
      default: null,
    },
    currentStatus: {
      type: String,
      enum: Object.values(SHIPMENT_STATUS),
      default: SHIPMENT_STATUS.CREATED,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

shipmentSchema.index({ orderNumber: 1 });
shipmentSchema.index({ currentStatus: 1 });
shipmentSchema.index({ gateVisit: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
