const Vehicle = require('../models/Vehicle');
const GateVisit = require('../models/GateVisit');
const Shipment = require('../models/Shipment');
const AppError = require('../utils/AppError');
const { VEHICLE_STATUS, GATE_VISIT_STATUS } = require('../config/constants');

class VehicleService {
  async createVehicle(data) {
    const existing = await Vehicle.findOne({
      registrationNumber: data.registrationNumber.toUpperCase().trim(),
    });
    if (existing) {
      throw new AppError(`Vehicle with registration number '${data.registrationNumber}' already exists.`, 409);
    }

    const vehicle = await Vehicle.create({
      ...data,
      registrationNumber: data.registrationNumber.toUpperCase().trim(),
    });
    return vehicle;
  }

  async getVehicles(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      vehicleType = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (search) {
      filter.registrationNumber = { $regex: search.trim(), $options: 'i' };
    }

    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    if (status) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('assignedDriver', 'fullName phoneNumber licenseNumber status')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter),
    ]);

    return {
      vehicles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getVehicleById(id) {
    const vehicle = await Vehicle.findById(id).populate('assignedDriver');
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    // Gate visit history
    const visitHistory = await GateVisit.find({ vehicle: id })
      .populate('driver', 'fullName licenseNumber phoneNumber')
      .populate('assignedSlot', 'slotCode')
      .sort({ entryTime: -1 })
      .limit(20);

    // Associated shipments
    const shipmentHistory = await Shipment.find({
      gateVisit: { $in: visitHistory.map((v) => v._id) },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      vehicle,
      visitHistory,
      shipmentHistory,
    };
  }

  async updateVehicle(id, data) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    if (data.registrationNumber) {
      const formattedReg = data.registrationNumber.toUpperCase().trim();
      if (formattedReg !== vehicle.registrationNumber) {
        const duplicate = await Vehicle.findOne({ registrationNumber: formattedReg });
        if (duplicate) {
          throw new AppError(`Registration number '${formattedReg}' is already in use.`, 409);
        }
        vehicle.registrationNumber = formattedReg;
      }
    }

    if (data.vehicleType) vehicle.vehicleType = data.vehicleType;
    if (data.makeModel) vehicle.makeModel = data.makeModel;
    if (data.capacity !== undefined) vehicle.capacity = data.capacity;
    if (data.capacityUnit) vehicle.capacityUnit = data.capacityUnit;
    if (data.assignedDriver !== undefined) vehicle.assignedDriver = data.assignedDriver || null;
    if (data.status) vehicle.status = data.status;
    if (data.notes !== undefined) vehicle.notes = data.notes;

    await vehicle.save();
    return vehicle;
  }

  async deleteVehicle(id) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    // Check for active visit inside yard
    const activeVisit = await GateVisit.findOne({
      vehicle: id,
      status: GATE_VISIT_STATUS.INSIDE_YARD,
    });

    if (activeVisit) {
      throw new AppError(
        'Cannot delete or archive vehicle while it is currently inside the yard. Please process gate exit first.',
        400
      );
    }

    // Check if vehicle has historical gate visits
    const hasHistory = await GateVisit.exists({ vehicle: id });

    if (hasHistory) {
      // Archive instead of permanent deletion to preserve historical visit integrity
      vehicle.status = VEHICLE_STATUS.ARCHIVED;
      await vehicle.save();
      return { archived: true, message: 'Vehicle has visit history and has been archived safely.' };
    }

    // Hard delete if clean record
    await Vehicle.findByIdAndDelete(id);
    return { archived: false, message: 'Vehicle deleted successfully.' };
  }
}

module.exports = new VehicleService();
