const GateVisit = require('../models/GateVisit');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const YardSlot = require('../models/YardSlot');
const YardMovement = require('../models/YardMovement');
const AppError = require('../utils/AppError');
const {
  GATE_VISIT_STATUS,
  VEHICLE_STATUS,
  DRIVER_STATUS,
  YARD_SLOT_STATUS,
  YARD_MOVEMENT_ACTIONS,
} = require('../config/constants');
const { withTransaction } = require('../config/db');

class GateVisitService {
  async generateGatePassNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `GP-${dateStr}-`;

    // Find latest gate pass for today
    const latest = await GateVisit.findOne({
      gatePassNumber: new RegExp(`^${prefix}`),
    })
      .sort({ gatePassNumber: -1 })
      .select('gatePassNumber');

    let sequence = 1;
    if (latest && latest.gatePassNumber) {
      const parts = latest.gatePassNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  async createGateEntry(data, userId) {
    const { vehicleId, driverId, purpose, shipmentReference, assignedSlot, notes } = data;

    // 1. Validate vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }
    if (vehicle.status !== VEHICLE_STATUS.ACTIVE) {
      throw new AppError(
        `Vehicle '${vehicle.registrationNumber}' is currently ${vehicle.status}. Only Active vehicles can enter the yard.`,
        400
      );
    }

    // 2. Prevent duplicate active visits
    const activeVisit = await GateVisit.findOne({
      vehicle: vehicleId,
      status: GATE_VISIT_STATUS.INSIDE_YARD,
    });
    if (activeVisit) {
      throw new AppError(
        `Vehicle '${vehicle.registrationNumber}' is already inside the yard under Gate Pass '${activeVisit.gatePassNumber}'.`,
        400
      );
    }

    // 3. Validate driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new AppError('Driver not found.', 404);
    }
    if (driver.status !== DRIVER_STATUS.ACTIVE) {
      throw new AppError(
        `Driver '${driver.fullName}' is Inactive and cannot be assigned to new gate visits.`,
        400
      );
    }
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      throw new AppError(
        `Driver '${driver.fullName}' has an expired license (${new Date(driver.licenseExpiryDate).toLocaleDateString()}). Access denied.`,
        400
      );
    }

    return await withTransaction(async (session) => {
      let slotDoc = null;
      if (assignedSlot) {
        slotDoc = await YardSlot.findOne({
          _id: assignedSlot,
          status: YARD_SLOT_STATUS.AVAILABLE,
        }).session(session);

        if (!slotDoc) {
          throw new AppError('The selected parking slot is not available or does not exist.', 409);
        }
      }

      const gatePassNumber = await this.generateGatePassNumber();

      const newVisit = new GateVisit({
        gatePassNumber,
        vehicle: vehicleId,
        driver: driverId,
        entryTime: new Date(),
        status: GATE_VISIT_STATUS.INSIDE_YARD,
        assignedSlot: assignedSlot || null,
        shipmentReference: shipmentReference || '',
        purpose,
        notes: notes || '',
        recordedByEntry: userId,
      });

      await newVisit.save({ session });

      if (slotDoc) {
        slotDoc.status = YARD_SLOT_STATUS.OCCUPIED;
        slotDoc.currentVisit = newVisit._id;
        slotDoc.currentVehicle = vehicleId;
        await slotDoc.save({ session });

        await YardMovement.create(
          [
            {
              gateVisit: newVisit._id,
              vehicle: vehicleId,
              action: YARD_MOVEMENT_ACTIONS.ALLOCATION,
              toSlot: slotDoc._id,
              reason: 'Initial gate entry slot assignment',
              performedBy: userId,
              timestamp: new Date(),
            },
          ],
          { session }
        );
      }

      return await GateVisit.findById(newVisit._id)
        .populate('vehicle', 'registrationNumber vehicleType makeModel')
        .populate('driver', 'fullName phoneNumber licenseNumber')
        .populate('assignedSlot', 'slotCode zone')
        .populate('recordedByEntry', 'name email')
        .session(session);
    });
  }

  async recordExit(visitId, userId, exitNotes = '') {
    const visit = await GateVisit.findById(visitId);
    if (!visit) {
      throw new AppError('Gate visit record not found.', 404);
    }

    if (visit.status === GATE_VISIT_STATUS.EXITED) {
      throw new AppError('Gate exit has already been recorded for this visit.', 400);
    }

    if (visit.status === GATE_VISIT_STATUS.CANCELLED) {
      throw new AppError('Cannot record exit for a cancelled visit.', 400);
    }

    return await withTransaction(async (session) => {
      // If slot was held, release it
      if (visit.assignedSlot) {
        const slot = await YardSlot.findById(visit.assignedSlot).session(session);
        if (slot) {
          slot.status = YARD_SLOT_STATUS.AVAILABLE;
          slot.currentVisit = null;
          slot.currentVehicle = null;
          await slot.save({ session });

          await YardMovement.create(
            [
              {
                gateVisit: visit._id,
                vehicle: visit.vehicle,
                action: YARD_MOVEMENT_ACTIONS.RELEASE,
                fromSlot: slot._id,
                reason: 'Gate exit release',
                performedBy: userId,
                timestamp: new Date(),
              },
            ],
            { session }
          );
        }
      }

      visit.exitTime = new Date();
      visit.status = GATE_VISIT_STATUS.EXITED;
      visit.recordedByExit = userId;
      if (exitNotes) {
        visit.notes = visit.notes ? `${visit.notes} | Exit Note: ${exitNotes}` : exitNotes;
      }
      visit.assignedSlot = null;

      await visit.save({ session });

      return await GateVisit.findById(visit._id)
        .populate('vehicle')
        .populate('driver')
        .populate('recordedByEntry', 'name email')
        .populate('recordedByExit', 'name email')
        .session(session);
    });
  }

  async getGateVisits(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      purpose = '',
      startDate = '',
      endDate = '',
      sortBy = 'entryTime',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (purpose) {
      filter.purpose = purpose;
    }

    if (startDate || endDate) {
      filter.entryTime = {};
      if (startDate) {
        filter.entryTime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.entryTime.$lte = end;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingVehicles = await Vehicle.find({ registrationNumber: searchRegex }).select('_id');
      const matchingDrivers = await Driver.find({
        $or: [{ fullName: searchRegex }, { licenseNumber: searchRegex }],
      }).select('_id');

      filter.$or = [
        { gatePassNumber: searchRegex },
        { shipmentReference: searchRegex },
        { vehicle: { $in: matchingVehicles.map((v) => v._id) } },
        { driver: { $in: matchingDrivers.map((d) => d._id) } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [visits, total] = await Promise.all([
      GateVisit.find(filter)
        .populate('vehicle', 'registrationNumber vehicleType makeModel')
        .populate('driver', 'fullName phoneNumber licenseNumber')
        .populate('assignedSlot', 'slotCode zone')
        .populate('recordedByEntry', 'name')
        .populate('recordedByExit', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      GateVisit.countDocuments(filter),
    ]);

    // Calculate duration in minutes for completed and ongoing visits
    const enrichedVisits = visits.map((visit) => {
      const obj = visit.toObject();
      const entryMs = new Date(visit.entryTime).getTime();
      const exitMs = visit.exitTime ? new Date(visit.exitTime).getTime() : Date.now();
      const durationMinutes = Math.round((exitMs - entryMs) / (1000 * 60));
      obj.durationMinutes = durationMinutes;
      return obj;
    });

    return {
      visits: enrichedVisits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getGateVisitById(id) {
    const visit = await GateVisit.findById(id)
      .populate('vehicle')
      .populate('driver')
      .populate({
        path: 'assignedSlot',
        populate: { path: 'zone', select: 'name code' },
      })
      .populate('recordedByEntry', 'name email role')
      .populate('recordedByExit', 'name email role');

    if (!visit) {
      throw new AppError('Gate visit record not found.', 404);
    }

    const movements = await YardMovement.find({ gateVisit: id })
      .populate('fromSlot', 'slotCode')
      .populate('toSlot', 'slotCode')
      .populate('performedBy', 'name')
      .sort({ timestamp: 1 });

    const obj = visit.toObject();
    const entryMs = new Date(visit.entryTime).getTime();
    const exitMs = visit.exitTime ? new Date(visit.exitTime).getTime() : Date.now();
    obj.durationMinutes = Math.round((exitMs - entryMs) / (1000 * 60));
    obj.movements = movements;

    return obj;
  }
}

module.exports = new GateVisitService();
