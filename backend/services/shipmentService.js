const Shipment = require('../models/Shipment');
const ShipmentEvent = require('../models/ShipmentEvent');
const GateVisit = require('../models/GateVisit');
const AppError = require('../utils/AppError');
const { SHIPMENT_STATUS } = require('../config/constants');
const { withTransaction } = require('../config/db');

// Allowed status transition map
const ALLOWED_TRANSITIONS = {
  [SHIPMENT_STATUS.CREATED]: [SHIPMENT_STATUS.ARRIVED, SHIPMENT_STATUS.LOADING, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.ARRIVED]: [SHIPMENT_STATUS.LOADING, SHIPMENT_STATUS.UNLOADING, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.LOADING]: [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.IN_TRANSIT]: [SHIPMENT_STATUS.ARRIVED, SHIPMENT_STATUS.UNLOADING, SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.UNLOADING]: [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.DELIVERED]: [], // Terminal state
  [SHIPMENT_STATUS.CANCELLED]: [], // Terminal state
};

class ShipmentService {
  async generateTrackingNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `TRK-${dateStr}-`;

    const latest = await Shipment.findOne({
      trackingNumber: new RegExp(`^${prefix}`),
    })
      .sort({ trackingNumber: -1 })
      .select('trackingNumber');

    let sequence = 1;
    if (latest && latest.trackingNumber) {
      const parts = latest.trackingNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  async createShipment(data, userId) {
    if (data.gateVisit) {
      const visit = await GateVisit.findById(data.gateVisit);
      if (!visit) throw new AppError('Associated gate visit not found.', 404);
    }

    return await withTransaction(async (session) => {
      const trackingNumber = await this.generateTrackingNumber();

      const shipment = new Shipment({
        ...data,
        trackingNumber,
        currentStatus: data.currentStatus || SHIPMENT_STATUS.CREATED,
        createdBy: userId,
      });

      await shipment.save({ session });

      // Create initial chronological event
      await ShipmentEvent.create(
        [
          {
            shipment: shipment._id,
            status: shipment.currentStatus,
            location: data.origin || 'Origin Facility',
            notes: data.description ? `Shipment created: ${data.description}` : 'Shipment registered in system',
            updatedBy: userId,
            timestamp: new Date(),
          },
        ],
        { session }
      );

      return shipment;
    });
  }

  async getShipments(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};
    if (status) filter.currentStatus = status;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { trackingNumber: searchRegex },
        { orderNumber: searchRegex },
        { consignee: searchRegex },
        { origin: searchRegex },
        { destination: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [shipments, total] = await Promise.all([
      Shipment.find(filter)
        .populate({
          path: 'gateVisit',
          select: 'gatePassNumber status vehicle driver',
          populate: [
            { path: 'vehicle', select: 'registrationNumber vehicleType' },
            { path: 'driver', select: 'fullName' },
          ],
        })
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Shipment.countDocuments(filter),
    ]);

    return {
      shipments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getShipmentById(id) {
    const shipment = await Shipment.findById(id)
      .populate({
        path: 'gateVisit',
        populate: [
          { path: 'vehicle' },
          { path: 'driver' },
          { path: 'assignedSlot' },
        ],
      })
      .populate('createdBy', 'name email');

    if (!shipment) throw new AppError('Shipment not found.', 404);

    const events = await ShipmentEvent.find({ shipment: id })
      .populate('updatedBy', 'name email')
      .sort({ timestamp: 1 });

    const obj = shipment.toObject();
    obj.timeline = events;
    return obj;
  }

  async addEvent(shipmentId, eventData, userId) {
    const { status, location, notes } = eventData;

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) throw new AppError('Shipment not found.', 404);

    if (shipment.currentStatus === SHIPMENT_STATUS.DELIVERED) {
      throw new AppError('Cannot update status for a Delivered shipment.', 400);
    }

    if (shipment.currentStatus === SHIPMENT_STATUS.CANCELLED) {
      throw new AppError('Cannot update status for a Cancelled shipment.', 400);
    }

    // Check valid transitions
    const allowed = ALLOWED_TRANSITIONS[shipment.currentStatus] || [];
    if (!allowed.includes(status) && status !== shipment.currentStatus) {
      throw new AppError(
        `Invalid status transition from '${shipment.currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'None'}`,
        400
      );
    }

    return await withTransaction(async (session) => {
      shipment.currentStatus = status;
      await shipment.save({ session });

      const newEvent = new ShipmentEvent({
        shipment: shipment._id,
        status,
        location: location || 'Yard Facility',
        notes: notes || '',
        updatedBy: userId,
        timestamp: new Date(),
      });

      await newEvent.save({ session });

      return await ShipmentEvent.findById(newEvent._id)
        .populate('updatedBy', 'name email')
        .session(session);
    });
  }

  async getShipmentEvents(shipmentId) {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) throw new AppError('Shipment not found.', 404);

    return await ShipmentEvent.find({ shipment: shipmentId })
      .populate('updatedBy', 'name email')
      .sort({ timestamp: 1 });
  }

  // Restricted public tracking (omits internal staff IDs, confidential notes, visit references)
  async getPublicTracking(trackingNumber) {
    const shipment = await Shipment.findOne({
      trackingNumber: trackingNumber.toUpperCase().trim(),
    }).select('trackingNumber orderNumber origin destination currentStatus createdAt');

    if (!shipment) {
      throw new AppError(`Shipment with tracking number '${trackingNumber}' was not found.`, 404);
    }

    const events = await ShipmentEvent.find({ shipment: shipment._id })
      .select('status location timestamp notes')
      .sort({ timestamp: 1 });

    return {
      trackingNumber: shipment.trackingNumber,
      orderNumber: shipment.orderNumber,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.currentStatus,
      createdAt: shipment.createdAt,
      timeline: events.map((e) => ({
        status: e.status,
        location: e.location,
        timestamp: e.timestamp,
        notes: e.notes,
      })),
    };
  }
}

module.exports = new ShipmentService();
