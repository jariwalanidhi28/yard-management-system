const Dock = require('../models/Dock');
const DockAppointment = require('../models/DockAppointment');
const GateVisit = require('../models/GateVisit');
const AppError = require('../utils/AppError');
const {
  DOCK_STATUS,
  DOCK_APPOINTMENT_STATUS,
  GATE_VISIT_STATUS,
} = require('../config/constants');
const { withTransaction } = require('../config/db');

class DockService {
  // Docks CRUD
  async createDock(data) {
    const codeUpper = data.code.toUpperCase().trim();
    const existing = await Dock.findOne({ code: codeUpper });
    if (existing) {
      throw new AppError(`Dock with code '${codeUpper}' already exists.`, 409);
    }
    return await Dock.create({
      ...data,
      code: codeUpper,
    });
  }

  async getDocks() {
    return await Dock.find().sort({ code: 1 });
  }

  async getDockById(id) {
    const dock = await Dock.findById(id);
    if (!dock) throw new AppError('Dock not found.', 404);
    return dock;
  }

  async updateDock(id, data) {
    const dock = await Dock.findById(id);
    if (!dock) throw new AppError('Dock not found.', 404);

    if (data.code) {
      const codeUpper = data.code.toUpperCase().trim();
      if (codeUpper !== dock.code) {
        const dup = await Dock.findOne({ code: codeUpper });
        if (dup) throw new AppError(`Dock code '${codeUpper}' is already in use.`, 409);
        dock.code = codeUpper;
      }
    }
    if (data.name) dock.name = data.name;
    if (data.dockType) dock.dockType = data.dockType;
    if (data.location !== undefined) dock.location = data.location;
    if (data.status) dock.status = data.status;
    if (data.operationalHours) dock.operationalHours = data.operationalHours;
    if (data.notes !== undefined) dock.notes = data.notes;

    await dock.save();
    return dock;
  }

  async deleteDock(id) {
    const hasAppointments = await DockAppointment.exists({
      dock: id,
      status: { $in: [DOCK_APPOINTMENT_STATUS.SCHEDULED, DOCK_APPOINTMENT_STATUS.IN_PROGRESS] },
    });
    if (hasAppointments) {
      throw new AppError('Cannot delete dock with active or scheduled appointments.', 400);
    }
    const dock = await Dock.findByIdAndDelete(id);
    if (!dock) throw new AppError('Dock not found.', 404);
    return { message: 'Dock deleted successfully.' };
  }

  // Helper to parse date and time strings into exact UTC Date objects
  combineDateAndTime(dateStr, timeStr) {
    const d = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10));
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  // Create Appointment
  async createAppointment(data, userId) {
    const { dock: dockId, gateVisit: visitId, appointmentDate, startTime, endTime, operationType, notes } = data;

    // 1. Validate dock
    const dock = await Dock.findById(dockId);
    if (!dock) throw new AppError('Dock not found.', 404);
    if (dock.status === DOCK_STATUS.MAINTENANCE) {
      throw new AppError(`Dock '${dock.name} (${dock.code})' is currently under maintenance and cannot accept bookings.`, 400);
    }

    // 2. Validate gate visit
    const visit = await GateVisit.findById(visitId);
    if (!visit) throw new AppError('Gate visit record not found.', 404);
    if (visit.status !== GATE_VISIT_STATUS.INSIDE_YARD) {
      throw new AppError('Dock appointments can only be booked for vehicles currently inside the yard.', 400);
    }

    // 3. Validate start/end times
    const startDateTime = this.combineDateAndTime(appointmentDate, startTime);
    const endDateTime = this.combineDateAndTime(appointmentDate, endTime);

    if (endDateTime <= startDateTime) {
      throw new AppError('Appointment end time must be after start time.', 400);
    }

    return await withTransaction(async (session) => {
      // 4. Concurrency & Overlap Prevention
      const overlapping = await DockAppointment.findOne({
        dock: dockId,
        status: { $in: [DOCK_APPOINTMENT_STATUS.SCHEDULED, DOCK_APPOINTMENT_STATUS.IN_PROGRESS] },
        startDateTime: { $lt: endDateTime },
        endDateTime: { $gt: startDateTime },
      }).session(session);

      if (overlapping) {
        throw new AppError(
          `Dock '${dock.name}' already has an overlapping appointment (${overlapping.startTime} - ${overlapping.endTime}).`,
          409
        );
      }

      const appointment = new DockAppointment({
        dock: dockId,
        gateVisit: visitId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        startDateTime,
        endDateTime,
        operationType: operationType || 'Loading',
        status: DOCK_APPOINTMENT_STATUS.SCHEDULED,
        notes: notes || '',
        createdBy: userId,
      });

      await appointment.save({ session });

      return await DockAppointment.findById(appointment._id)
        .populate('dock', 'name code dockType location')
        .populate({
          path: 'gateVisit',
          populate: [
            { path: 'vehicle', select: 'registrationNumber vehicleType makeModel' },
            { path: 'driver', select: 'fullName phoneNumber' },
          ],
        })
        .populate('createdBy', 'name email')
        .session(session);
    });
  }

  // Get appointments with filters and calendar view
  async getAppointments(query = {}) {
    const {
      dock = '',
      status = '',
      operationType = '',
      date = '',
      startDate = '',
      endDate = '',
    } = query;

    const filter = {};
    if (dock) filter.dock = dock;
    if (status) filter.status = status;
    if (operationType) filter.operationType = operationType;

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.startDateTime = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate || endDate) {
      filter.startDateTime = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        filter.startDateTime.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.startDateTime.$lte = e;
      }
    }

    const appointments = await DockAppointment.find(filter)
      .populate('dock', 'name code dockType location status')
      .populate({
        path: 'gateVisit',
        populate: [
          { path: 'vehicle', select: 'registrationNumber vehicleType makeModel' },
          { path: 'driver', select: 'fullName phoneNumber' },
        ],
      })
      .populate('createdBy', 'name email')
      .sort({ startDateTime: 1 });

    const now = new Date();
    // Mark overdue appointments (scheduled but past end time)
    const enrichedAppointments = appointments.map((appt) => {
      const obj = appt.toObject();
      obj.isOverdue =
        obj.status === DOCK_APPOINTMENT_STATUS.SCHEDULED && new Date(obj.endDateTime) < now;
      return obj;
    });

    return enrichedAppointments;
  }

  async getAppointmentById(id) {
    const appointment = await DockAppointment.findById(id)
      .populate('dock')
      .populate({
        path: 'gateVisit',
        populate: [
          { path: 'vehicle' },
          { path: 'driver' },
          { path: 'assignedSlot' },
        ],
      })
      .populate('createdBy', 'name email');

    if (!appointment) throw new AppError('Dock appointment not found.', 404);
    return appointment;
  }

  // Start Appointment
  async startAppointment(id, userId) {
    const appointment = await DockAppointment.findById(id);
    if (!appointment) throw new AppError('Dock appointment not found.', 404);

    if (appointment.status !== DOCK_APPOINTMENT_STATUS.SCHEDULED) {
      throw new AppError(
        `Cannot start appointment with current status '${appointment.status}'. Must be '${DOCK_APPOINTMENT_STATUS.SCHEDULED}'.`,
        400
      );
    }

    appointment.status = DOCK_APPOINTMENT_STATUS.IN_PROGRESS;
    await appointment.save();
    return appointment;
  }

  // Complete Appointment
  async completeAppointment(id, userId) {
    const appointment = await DockAppointment.findById(id);
    if (!appointment) throw new AppError('Dock appointment not found.', 404);

    if (appointment.status !== DOCK_APPOINTMENT_STATUS.IN_PROGRESS) {
      throw new AppError(
        `Cannot complete appointment with current status '${appointment.status}'. Must be '${DOCK_APPOINTMENT_STATUS.IN_PROGRESS}'.`,
        400
      );
    }

    appointment.status = DOCK_APPOINTMENT_STATUS.COMPLETED;
    await appointment.save();
    return appointment;
  }

  // Cancel Appointment
  async cancelAppointment(id, userId, reason = '') {
    const appointment = await DockAppointment.findById(id);
    if (!appointment) throw new AppError('Dock appointment not found.', 404);

    if (appointment.status === DOCK_APPOINTMENT_STATUS.COMPLETED) {
      throw new AppError('Completed appointments cannot be cancelled.', 400);
    }

    appointment.status = DOCK_APPOINTMENT_STATUS.CANCELLED;
    if (reason) {
      appointment.notes = appointment.notes
        ? `${appointment.notes} | Cancel Reason: ${reason}`
        : `Cancel Reason: ${reason}`;
    }
    await appointment.save();
    return appointment;
  }
}

module.exports = new DockService();
