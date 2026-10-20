const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const GateVisit = require('../models/GateVisit');
const AppError = require('../utils/AppError');
const { DRIVER_STATUS, GATE_VISIT_STATUS } = require('../config/constants');

class DriverService {
  async createDriver(data) {
    const formattedLicense = data.licenseNumber.toUpperCase().trim();
    const existing = await Driver.findOne({ licenseNumber: formattedLicense });
    if (existing) {
      throw new AppError(`Driver with license number '${formattedLicense}' already exists.`, 409);
    }

    const driver = await Driver.create({
      ...data,
      licenseNumber: formattedLicense,
    });
    return driver;
  }

  async getDrivers(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      expiringSoon = false,
      sortBy = 'fullName',
      sortOrder = 'asc',
    } = query;

    const filter = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { licenseNumber: { $regex: search.trim(), $options: 'i' } },
        { phoneNumber: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (expiringSoon === 'true' || expiringSoon === true) {
      const thirtyDaysAhead = new Date();
      thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
      filter.licenseExpiryDate = { $lte: thirtyDaysAhead };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [drivers, total] = await Promise.all([
      Driver.find(filter).sort(sort).skip(skip).limit(limitNum),
      Driver.countDocuments(filter),
    ]);

    // Attach license status flag (Valid, Expiring Soon, Expired)
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const enrichedDrivers = drivers.map((driver) => {
      const obj = driver.toObject();
      const expiry = new Date(driver.licenseExpiryDate);
      if (expiry < now) {
        obj.licenseValidity = 'Expired';
      } else if (expiry <= thirtyDaysFromNow) {
        obj.licenseValidity = 'Expiring Soon';
      } else {
        obj.licenseValidity = 'Valid';
      }
      return obj;
    });

    return {
      drivers: enrichedDrivers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getDriverById(id) {
    const driver = await Driver.findById(id);
    if (!driver) {
      throw new AppError('Driver not found.', 404);
    }

    // Associated vehicles and gate visits
    const [assignedVehicles, visitHistory] = await Promise.all([
      Vehicle.find({ assignedDriver: id }),
      GateVisit.find({ driver: id })
        .populate('vehicle', 'registrationNumber vehicleType makeModel')
        .populate('assignedSlot', 'slotCode')
        .sort({ entryTime: -1 })
        .limit(20),
    ]);

    return {
      driver,
      assignedVehicles,
      visitHistory,
    };
  }

  async updateDriver(id, data) {
    const driver = await Driver.findById(id);
    if (!driver) {
      throw new AppError('Driver not found.', 404);
    }

    if (data.licenseNumber) {
      const formattedLicense = data.licenseNumber.toUpperCase().trim();
      if (formattedLicense !== driver.licenseNumber) {
        const duplicate = await Driver.findOne({ licenseNumber: formattedLicense });
        if (duplicate) {
          throw new AppError(`License number '${formattedLicense}' is already registered.`, 409);
        }
        driver.licenseNumber = formattedLicense;
      }
    }

    if (data.fullName) driver.fullName = data.fullName;
    if (data.phoneNumber) driver.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) driver.email = data.email;
    if (data.licenseExpiryDate) driver.licenseExpiryDate = data.licenseExpiryDate;
    if (data.address !== undefined) driver.address = data.address;
    if (data.emergencyContact !== undefined) driver.emergencyContact = data.emergencyContact;
    if (data.status) driver.status = data.status;
    if (data.notes !== undefined) driver.notes = data.notes;

    await driver.save();
    return driver;
  }

  async deleteDriver(id) {
    const driver = await Driver.findById(id);
    if (!driver) {
      throw new AppError('Driver not found.', 404);
    }

    // Check if active in yard
    const activeVisit = await GateVisit.findOne({
      driver: id,
      status: GATE_VISIT_STATUS.INSIDE_YARD,
    });

    if (activeVisit) {
      throw new AppError('Cannot delete driver while on an active yard visit.', 400);
    }

    const hasHistory = await GateVisit.exists({ driver: id });
    if (hasHistory) {
      // Soft-deactivate to maintain audit trail
      driver.status = DRIVER_STATUS.INACTIVE;
      await driver.save();
      return { deactivated: true, message: 'Driver has gate visit history and has been deactivated.' };
    }

    // Remove driver reference from assigned vehicles
    await Vehicle.updateMany({ assignedDriver: id }, { assignedDriver: null });
    await Driver.findByIdAndDelete(id);

    return { deactivated: false, message: 'Driver deleted successfully.' };
  }
}

module.exports = new DriverService();
