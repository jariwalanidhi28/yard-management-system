const mongoose = require('mongoose');
const { DOCK_APPOINTMENT_STATUS, DOCK_OPERATION_TYPES } = require('../config/constants');

const dockAppointmentSchema = new mongoose.Schema(
  {
    dock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dock',
      required: [true, 'Dock reference is required'],
    },
    gateVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GateVisit',
      required: [true, 'Gate visit reference is required'],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      trim: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    operationType: {
      type: String,
      enum: DOCK_OPERATION_TYPES,
      default: 'Loading',
    },
    status: {
      type: String,
      enum: Object.values(DOCK_APPOINTMENT_STATUS),
      default: DOCK_APPOINTMENT_STATUS.SCHEDULED,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

dockAppointmentSchema.index({ dock: 1, startDateTime: 1, endDateTime: 1 });
dockAppointmentSchema.index({ gateVisit: 1 });
dockAppointmentSchema.index({ status: 1 });
dockAppointmentSchema.index({ startDateTime: 1 });

module.exports = mongoose.model('DockAppointment', dockAppointmentSchema);
