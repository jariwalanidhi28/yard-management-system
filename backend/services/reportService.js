const GateVisit = require('../models/GateVisit');
const YardSlot = require('../models/YardSlot');
const YardZone = require('../models/YardZone');
const Dock = require('../models/Dock');
const DockAppointment = require('../models/DockAppointment');
const Shipment = require('../models/Shipment');
const ShipmentEvent = require('../models/ShipmentEvent');
const Driver = require('../models/Driver');
const YardMovement = require('../models/YardMovement');
const { generateCsv } = require('../utils/csvHelper');
const {
  GATE_VISIT_STATUS,
  YARD_SLOT_STATUS,
  DOCK_APPOINTMENT_STATUS,
  SHIPMENT_STATUS,
} = require('../config/constants');

class ReportService {
  // 1. Gate Visits & Turnaround Time Report
  async getGateVisitsReport(query = {}) {
    const { startDate, endDate, status, search, page = 1, limit = 20 } = query;
    const filter = {};

    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.entryTime = {};
      if (startDate) filter.entryTime.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.entryTime.$lte = e;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [visits, total] = await Promise.all([
      GateVisit.find(filter)
        .populate('vehicle', 'registrationNumber vehicleType makeModel')
        .populate('driver', 'fullName licenseNumber phoneNumber')
        .populate('assignedSlot', 'slotCode')
        .populate('recordedByEntry', 'name')
        .populate('recordedByExit', 'name')
        .sort({ entryTime: -1 })
        .skip(skip)
        .limit(limitNum),
      GateVisit.countDocuments(filter),
    ]);

    // Calculate turnaround time for completed visits vs ongoing visits
    const completedVisits = await GateVisit.find({
      ...filter,
      status: GATE_VISIT_STATUS.EXITED,
      exitTime: { $ne: null },
    });

    let totalTurnaroundMinutes = 0;
    completedVisits.forEach((v) => {
      const diffMs = new Date(v.exitTime) - new Date(v.entryTime);
      totalTurnaroundMinutes += Math.round(diffMs / (1000 * 60));
    });

    const averageTurnaroundMinutes =
      completedVisits.length > 0
        ? Math.round(totalTurnaroundMinutes / completedVisits.length)
        : 0;

    const ongoingCount = await GateVisit.countDocuments({
      ...filter,
      status: GATE_VISIT_STATUS.INSIDE_YARD,
    });

    const enrichedVisits = visits.map((v) => {
      const obj = v.toObject();
      const entryMs = new Date(v.entryTime).getTime();
      const exitMs = v.exitTime ? new Date(v.exitTime).getTime() : Date.now();
      obj.turnaroundMinutes = Math.round((exitMs - entryMs) / (1000 * 60));
      obj.isOngoing = !v.exitTime;
      return obj;
    });

    return {
      summary: {
        totalVisits: total,
        completedVisits: completedVisits.length,
        ongoingVisits: ongoingCount,
        averageTurnaroundMinutes,
      },
      visits: enrichedVisits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // 2. Yard Utilization Report (Excluding blocked slots from denominator)
  async getYardUtilizationReport() {
    const zones = await YardZone.find().sort({ code: 1 }).lean();
    const slots = await YardSlot.find().populate('zone', 'name code').lean();

    const totalSlots = slots.length;
    const availableSlots = slots.filter((s) => s.status === YARD_SLOT_STATUS.AVAILABLE).length;
    const occupiedSlots = slots.filter((s) => s.status === YARD_SLOT_STATUS.OCCUPIED).length;
    const blockedSlots = slots.filter((s) => s.status === YARD_SLOT_STATUS.BLOCKED).length;

    const usableSlots = totalSlots - blockedSlots;
    const overallUtilization =
      usableSlots > 0 ? Math.round((occupiedSlots / usableSlots) * 100) : 0;

    const zoneBreakdown = zones.map((z) => {
      const zoneSlots = slots.filter((s) => s.zone && s.zone._id.toString() === z._id.toString());
      const zTotal = zoneSlots.length;
      const zAvail = zoneSlots.filter((s) => s.status === YARD_SLOT_STATUS.AVAILABLE).length;
      const zOcc = zoneSlots.filter((s) => s.status === YARD_SLOT_STATUS.OCCUPIED).length;
      const zBlock = zoneSlots.filter((s) => s.status === YARD_SLOT_STATUS.BLOCKED).length;
      const zUsable = zTotal - zBlock;
      const zUtil = zUsable > 0 ? Math.round((zOcc / zUsable) * 100) : 0;

      return {
        zoneId: z._id,
        name: z.name,
        code: z.code,
        totalSlots: zTotal,
        availableSlots: zAvail,
        occupiedSlots: zOcc,
        blockedSlots: zBlock,
        usableSlots: zUsable,
        utilizationPercentage: zUtil,
      };
    });

    return {
      summary: {
        totalSlots,
        availableSlots,
        occupiedSlots,
        blockedSlots,
        usableSlots,
        utilizationPercentage: overallUtilization,
      },
      zoneBreakdown,
    };
  }

  // 3. Dock Utilization Report
  async getDockUtilizationReport(query = {}) {
    const { startDate, endDate } = query;
    const filter = {};

    if (startDate || endDate) {
      filter.startDateTime = {};
      if (startDate) filter.startDateTime.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.startDateTime.$lte = e;
      }
    }

    const docks = await Dock.find().lean();
    const appointments = await DockAppointment.find(filter)
      .populate('dock', 'name code')
      .sort({ startDateTime: 1 })
      .lean();

    const totalScheduled = appointments.filter((a) => a.status === DOCK_APPOINTMENT_STATUS.SCHEDULED).length;
    const totalInProgress = appointments.filter((a) => a.status === DOCK_APPOINTMENT_STATUS.IN_PROGRESS).length;
    const totalCompleted = appointments.filter((a) => a.status === DOCK_APPOINTMENT_STATUS.COMPLETED).length;
    const totalCancelled = appointments.filter((a) => a.status === DOCK_APPOINTMENT_STATUS.CANCELLED).length;

    // Overdue count: scheduled with startDateTime < now
    const now = new Date();
    const overdueCount = appointments.filter(
      (a) => a.status === DOCK_APPOINTMENT_STATUS.SCHEDULED && new Date(a.startDateTime) < now
    ).length;

    const dockBreakdown = docks.map((dock) => {
      const dockAppts = appointments.filter(
        (a) => a.dock && a.dock._id.toString() === dock._id.toString()
      );
      return {
        dockId: dock._id,
        name: dock.name,
        code: dock.code,
        status: dock.status,
        dockType: dock.dockType,
        totalAppointments: dockAppts.length,
        completed: dockAppts.filter((a) => a.status === DOCK_APPOINTMENT_STATUS.COMPLETED).length,
        inProgress: dockAppts.filter((a) => a.status === DOCK_APPOINTMENT_STATUS.IN_PROGRESS).length,
        scheduled: dockAppts.filter((a) => a.status === DOCK_APPOINTMENT_STATUS.SCHEDULED).length,
        cancelled: dockAppts.filter((a) => a.status === DOCK_APPOINTMENT_STATUS.CANCELLED).length,
      };
    });

    return {
      summary: {
        totalAppointments: appointments.length,
        totalScheduled,
        totalInProgress,
        totalCompleted,
        totalCancelled,
        overdueCount,
      },
      dockBreakdown,
    };
  }

  // 4. Shipment Summary Report
  async getShipmentsReport(query = {}) {
    const { status, startDate, endDate } = query;
    const filter = {};
    if (status) filter.currentStatus = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = e;
      }
    }

    const totalShipments = await Shipment.countDocuments(filter);
    const statusCounts = {};
    for (const s of Object.values(SHIPMENT_STATUS)) {
      statusCounts[s] = await Shipment.countDocuments({ ...filter, currentStatus: s });
    }

    const shipments = await Shipment.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    return {
      summary: {
        totalShipments,
        statusCounts,
      },
      shipments,
    };
  }

  // 5. Driver Activity Report
  async getDriverActivityReport() {
    const drivers = await Driver.find().sort({ fullName: 1 }).lean();
    const now = new Date();

    const activityData = await Promise.all(
      drivers.map(async (driver) => {
        const [totalVisits, activeVisits] = await Promise.all([
          GateVisit.countDocuments({ driver: driver._id }),
          GateVisit.countDocuments({ driver: driver._id, status: GATE_VISIT_STATUS.INSIDE_YARD }),
        ]);

        const expiry = new Date(driver.licenseExpiryDate);
        let licenseStatus = 'Valid';
        if (expiry < now) {
          licenseStatus = 'Expired';
        } else if (expiry <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
          licenseStatus = 'Expiring Soon';
        }

        return {
          id: driver._id,
          fullName: driver.fullName,
          licenseNumber: driver.licenseNumber,
          phoneNumber: driver.phoneNumber,
          status: driver.status,
          licenseStatus,
          licenseExpiryDate: driver.licenseExpiryDate,
          totalVisits,
          activeVisits,
        };
      })
    );

    return activityData;
  }

  // CSV Export with Formula Injection Protection
  async exportReportCsv(reportType, query = {}) {
    switch (reportType) {
      case 'gate-visits': {
        const reportData = await this.getGateVisitsReport({ ...query, limit: 1000 });
        const headers = [
          'Gate Pass #',
          'Vehicle',
          'Driver',
          'Purpose',
          'Slot',
          'Entry Time',
          'Exit Time',
          'Status',
          'Duration (Mins)',
        ];
        const fields = [
          'gatePassNumber',
          (row) => row.vehicle?.registrationNumber || 'N/A',
          (row) => row.driver?.fullName || 'N/A',
          'purpose',
          (row) => row.assignedSlot?.slotCode || 'N/A',
          (row) => (row.entryTime ? new Date(row.entryTime).toISOString() : ''),
          (row) => (row.exitTime ? new Date(row.exitTime).toISOString() : 'Ongoing'),
          'status',
          'turnaroundMinutes',
        ];
        return generateCsv(headers, fields, reportData.visits);
      }

      case 'yard-utilization': {
        const reportData = await this.getYardUtilizationReport();
        const headers = [
          'Zone Name',
          'Zone Code',
          'Total Slots',
          'Available Slots',
          'Occupied Slots',
          'Blocked Slots',
          'Usable Slots',
          'Utilization %',
        ];
        const fields = [
          'name',
          'code',
          'totalSlots',
          'availableSlots',
          'occupiedSlots',
          'blockedSlots',
          'usableSlots',
          'utilizationPercentage',
        ];
        return generateCsv(headers, fields, reportData.zoneBreakdown);
      }

      case 'dock-utilization': {
        const reportData = await this.getDockUtilizationReport(query);
        const headers = [
          'Dock Name',
          'Code',
          'Type',
          'Status',
          'Total Appts',
          'Completed',
          'In Progress',
          'Scheduled',
          'Cancelled',
        ];
        const fields = [
          'name',
          'code',
          'dockType',
          'status',
          'totalAppointments',
          'completed',
          'inProgress',
          'scheduled',
          'cancelled',
        ];
        return generateCsv(headers, fields, reportData.dockBreakdown);
      }

      case 'shipments': {
        const reportData = await this.getShipmentsReport(query);
        const headers = [
          'Tracking #',
          'Order #',
          'Consignee',
          'Origin',
          'Destination',
          'Status',
          'Weight',
          'Quantity',
          'Created Date',
        ];
        const fields = [
          'trackingNumber',
          'orderNumber',
          'consignee',
          'origin',
          'destination',
          'currentStatus',
          (row) => `${row.weight} ${row.weightUnit}`,
          'quantity',
          (row) => (row.createdAt ? new Date(row.createdAt).toISOString() : ''),
        ];
        return generateCsv(headers, fields, reportData.shipments);
      }

      case 'driver-activity': {
        const reportData = await this.getDriverActivityReport();
        const headers = [
          'Driver Name',
          'License #',
          'Phone',
          'Status',
          'License Validity',
          'Expiry Date',
          'Total Gate Visits',
          'Active Visits',
        ];
        const fields = [
          'fullName',
          'licenseNumber',
          'phoneNumber',
          'status',
          'licenseStatus',
          (row) => (row.licenseExpiryDate ? new Date(row.licenseExpiryDate).toISOString().slice(0, 10) : ''),
          'totalVisits',
          'activeVisits',
        ];
        return generateCsv(headers, fields, reportData);
      }

      case 'yard-movements': {
        const movements = await YardMovement.find()
          .populate('vehicle', 'registrationNumber')
          .populate('fromSlot', 'slotCode')
          .populate('toSlot', 'slotCode')
          .populate('performedBy', 'name')
          .populate('gateVisit', 'gatePassNumber')
          .sort({ timestamp: -1 })
          .limit(1000);

        const headers = [
          'Timestamp',
          'Gate Pass #',
          'Vehicle',
          'Action',
          'From Slot',
          'To Slot',
          'Reason',
          'Performed By',
        ];
        const fields = [
          (row) => (row.timestamp ? new Date(row.timestamp).toISOString() : ''),
          (row) => row.gateVisit?.gatePassNumber || 'N/A',
          (row) => row.vehicle?.registrationNumber || 'N/A',
          'action',
          (row) => row.fromSlot?.slotCode || 'N/A',
          (row) => row.toSlot?.slotCode || 'N/A',
          'reason',
          (row) => row.performedBy?.name || 'N/A',
        ];
        return generateCsv(headers, fields, movements);
      }

      default:
        throw new Error('Unsupported report export type.');
    }
  }
}

module.exports = new ReportService();
