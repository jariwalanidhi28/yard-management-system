const YardZone = require('../models/YardZone');
const YardSlot = require('../models/YardSlot');
const GateVisit = require('../models/GateVisit');
const YardMovement = require('../models/YardMovement');
const AppError = require('../utils/AppError');
const {
  YARD_SLOT_STATUS,
  GATE_VISIT_STATUS,
  YARD_MOVEMENT_ACTIONS,
} = require('../config/constants');
const { withTransaction } = require('../config/db');

class YardService {
  // Zones
  async createZone(data) {
    const existing = await YardZone.findOne({ code: data.code.toUpperCase().trim() });
    if (existing) {
      throw new AppError(`Yard zone with code '${data.code}' already exists.`, 409);
    }
    return await YardZone.create({
      ...data,
      code: data.code.toUpperCase().trim(),
    });
  }

  async getZones() {
    return await YardZone.find().sort({ code: 1 });
  }

  async getZoneById(id) {
    const zone = await YardZone.findById(id);
    if (!zone) throw new AppError('Yard zone not found.', 404);
    return zone;
  }

  async updateZone(id, data) {
    const zone = await YardZone.findById(id);
    if (!zone) throw new AppError('Yard zone not found.', 404);

    if (data.code) {
      const codeUpper = data.code.toUpperCase().trim();
      if (codeUpper !== zone.code) {
        const dup = await YardZone.findOne({ code: codeUpper });
        if (dup) throw new AppError(`Zone code '${codeUpper}' is already in use.`, 409);
        zone.code = codeUpper;
      }
    }
    if (data.name) zone.name = data.name;
    if (data.description !== undefined) zone.description = data.description;
    if (data.isActive !== undefined) zone.isActive = data.isActive;

    await zone.save();
    return zone;
  }

  async deleteZone(id) {
    const hasSlots = await YardSlot.exists({ zone: id });
    if (hasSlots) {
      throw new AppError('Cannot delete zone containing parking slots. Please reassign or delete slots first.', 400);
    }
    const zone = await YardZone.findByIdAndDelete(id);
    if (!zone) throw new AppError('Yard zone not found.', 404);
    return { message: 'Zone deleted successfully.' };
  }

  // Slots
  async createSlot(data) {
    const slotCodeUpper = data.slotCode.toUpperCase().trim();
    const zone = await YardZone.findById(data.zone);
    if (!zone) throw new AppError('Specified yard zone does not exist.', 404);

    const existing = await YardSlot.findOne({ zone: data.zone, slotCode: slotCodeUpper });
    if (existing) {
      throw new AppError(`Slot code '${slotCodeUpper}' already exists in zone '${zone.name}'.`, 409);
    }

    return await YardSlot.create({
      ...data,
      slotCode: slotCodeUpper,
    });
  }

  async getSlots(query = {}) {
    const { zone = '', status = '', slotType = '', search = '' } = query;
    const filter = {};

    if (zone) filter.zone = zone;
    if (status) filter.status = status;
    if (slotType) filter.slotType = slotType;
    if (search) filter.slotCode = { $regex: search.trim(), $options: 'i' };

    return await YardSlot.find(filter)
      .populate('zone', 'name code')
      .populate('currentVehicle', 'registrationNumber vehicleType makeModel')
      .populate({
        path: 'currentVisit',
        select: 'gatePassNumber entryTime driver',
        populate: { path: 'driver', select: 'fullName phoneNumber' },
      })
      .sort({ slotCode: 1 });
  }

  async updateSlot(id, data) {
    const slot = await YardSlot.findById(id);
    if (!slot) throw new AppError('Parking slot not found.', 404);

    if (data.status === YARD_SLOT_STATUS.BLOCKED && slot.status === YARD_SLOT_STATUS.OCCUPIED) {
      throw new AppError('Cannot block a currently occupied parking slot. Please reassign the vehicle first.', 400);
    }

    if (data.slotCode) {
      const codeUpper = data.slotCode.toUpperCase().trim();
      const zoneId = data.zone || slot.zone;
      if (codeUpper !== slot.slotCode || zoneId.toString() !== slot.zone.toString()) {
        const dup = await YardSlot.findOne({ zone: zoneId, slotCode: codeUpper });
        if (dup && dup._id.toString() !== id) {
          throw new AppError(`Slot code '${codeUpper}' already exists in this zone.`, 409);
        }
        slot.slotCode = codeUpper;
      }
    }

    if (data.zone) slot.zone = data.zone;
    if (data.slotType) slot.slotType = data.slotType;
    if (data.status) slot.status = data.status;
    if (data.notes !== undefined) slot.notes = data.notes;

    await slot.save();
    return slot;
  }

  async deleteSlot(id) {
    const slot = await YardSlot.findById(id);
    if (!slot) throw new AppError('Parking slot not found.', 404);

    if (slot.status === YARD_SLOT_STATUS.OCCUPIED) {
      throw new AppError('Cannot delete an occupied parking slot.', 400);
    }

    await YardSlot.findByIdAndDelete(id);
    return { message: 'Slot deleted successfully.' };
  }

  // Visual Yard Map
  async getYardMap() {
    const zones = await YardZone.find({ isActive: true }).sort({ code: 1 }).lean();
    const slots = await YardSlot.find()
      .populate('zone', 'name code')
      .populate('currentVehicle', 'registrationNumber vehicleType makeModel')
      .populate({
        path: 'currentVisit',
        select: 'gatePassNumber entryTime driver',
        populate: { path: 'driver', select: 'fullName' },
      })
      .sort({ slotCode: 1 })
      .lean();

    const zoneMap = zones.map((zone) => {
      const zoneSlots = slots.filter((s) => s.zone && s.zone._id.toString() === zone._id.toString());
      const availableCount = zoneSlots.filter((s) => s.status === YARD_SLOT_STATUS.AVAILABLE).length;
      const occupiedCount = zoneSlots.filter((s) => s.status === YARD_SLOT_STATUS.OCCUPIED).length;
      const blockedCount = zoneSlots.filter((s) => s.status === YARD_SLOT_STATUS.BLOCKED).length;

      return {
        ...zone,
        slots: zoneSlots,
        stats: {
          total: zoneSlots.length,
          available: availableCount,
          occupied: occupiedCount,
          blocked: blockedCount,
          utilization: zoneSlots.length > blockedCount
            ? Math.round((occupiedCount / (zoneSlots.length - blockedCount)) * 100)
            : 0,
        },
      };
    });

    return zoneMap;
  }

  // Slot Allocation (Concurrency-safe)
  async allocateSlot(slotId, visitId, userId) {
    const visit = await GateVisit.findById(visitId);
    if (!visit) throw new AppError('Gate visit record not found.', 404);
    if (visit.status !== GATE_VISIT_STATUS.INSIDE_YARD) {
      throw new AppError('Vehicle is not currently inside the yard.', 400);
    }

    return await withTransaction(async (session) => {
      // Atomic condition: find slot that is Available
      const targetSlot = await YardSlot.findOneAndUpdate(
        { _id: slotId, status: YARD_SLOT_STATUS.AVAILABLE },
        {
          $set: {
            status: YARD_SLOT_STATUS.OCCUPIED,
            currentVisit: visit._id,
            currentVehicle: visit.vehicle,
          },
        },
        { new: true, session }
      );

      if (!targetSlot) {
        throw new AppError('The requested parking slot is no longer available or is blocked.', 409);
      }

      // If visit already held another slot, release that previous slot
      let previousSlotId = null;
      if (visit.assignedSlot && visit.assignedSlot.toString() !== slotId) {
        previousSlotId = visit.assignedSlot;
        await YardSlot.findByIdAndUpdate(
          previousSlotId,
          {
            $set: {
              status: YARD_SLOT_STATUS.AVAILABLE,
              currentVisit: null,
              currentVehicle: null,
            },
          },
          { session }
        );
      }

      visit.assignedSlot = targetSlot._id;
      await visit.save({ session });

      // Record immutable movement log
      const movementAction = previousSlotId
        ? YARD_MOVEMENT_ACTIONS.REASSIGNMENT
        : YARD_MOVEMENT_ACTIONS.ALLOCATION;

      await YardMovement.create(
        [
          {
            gateVisit: visit._id,
            vehicle: visit.vehicle,
            action: movementAction,
            fromSlot: previousSlotId,
            toSlot: targetSlot._id,
            reason: previousSlotId ? 'Slot reassignment' : 'Direct yard allocation',
            performedBy: userId,
            timestamp: new Date(),
          },
        ],
        { session }
      );

      return targetSlot;
    });
  }

  // Release Slot
  async releaseSlot(slotId, userId, reason = 'Manual release') {
    return await withTransaction(async (session) => {
      const slot = await YardSlot.findById(slotId).session(session);
      if (!slot) throw new AppError('Parking slot not found.', 404);
      if (slot.status !== YARD_SLOT_STATUS.OCCUPIED) {
        throw new AppError('This slot is not currently occupied.', 400);
      }

      const visitId = slot.currentVisit;
      const vehicleId = slot.currentVehicle;

      if (visitId) {
        await GateVisit.findByIdAndUpdate(
          visitId,
          { $set: { assignedSlot: null } },
          { session }
        );
      }

      slot.status = YARD_SLOT_STATUS.AVAILABLE;
      slot.currentVisit = null;
      slot.currentVehicle = null;
      await slot.save({ session });

      if (visitId && vehicleId) {
        await YardMovement.create(
          [
            {
              gateVisit: visitId,
              vehicle: vehicleId,
              action: YARD_MOVEMENT_ACTIONS.RELEASE,
              fromSlot: slot._id,
              reason,
              performedBy: userId,
              timestamp: new Date(),
            },
          ],
          { session }
        );
      }

      return slot;
    });
  }

  // Reassign Slot
  async reassignSlot(visitId, newSlotId, userId, reason = 'Operator reassignment') {
    return await this.allocateSlot(newSlotId, visitId, userId);
  }

  // Movement History Audit Log
  async getMovements(query = {}) {
    const { page = 1, limit = 20, visitId = '', vehicleId = '' } = query;
    const filter = {};
    if (visitId) filter.gateVisit = visitId;
    if (vehicleId) filter.vehicle = vehicleId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [movements, total] = await Promise.all([
      YardMovement.find(filter)
        .populate('vehicle', 'registrationNumber vehicleType')
        .populate('fromSlot', 'slotCode zone')
        .populate('toSlot', 'slotCode zone')
        .populate('performedBy', 'name email')
        .populate('gateVisit', 'gatePassNumber')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      YardMovement.countDocuments(filter),
    ]);

    return {
      movements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}

module.exports = new YardService();
