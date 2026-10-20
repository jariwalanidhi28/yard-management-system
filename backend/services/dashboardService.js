const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const GateVisit = require('../models/GateVisit');
const YardSlot = require('../models/YardSlot');
const DockAppointment = require('../models/DockAppointment');
const Shipment = require('../models/Shipment');
const ShipmentEvent = require('../models/ShipmentEvent');
const {
  VEHICLE_STATUS,
  GATE_VISIT_STATUS,
  YARD_SLOT_STATUS,
  DOCK_APPOINTMENT_STATUS,
  SHIPMENT_STATUS,
} = require('../config/constants');

class DashboardService {
  async getDashboardMetrics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Core Summary Metrics
    const [
      totalActiveVehicles,
      vehiclesInsideYard,
      todayEntries,
      todayExits,
      availableSlots,
      occupiedSlots,
      blockedSlots,
      todayScheduledAppointments,
      appointmentsInProgress,
      activeShipments,
      deliveredShipments,
    ] = await Promise.all([
      Vehicle.countDocuments({ status: VEHICLE_STATUS.ACTIVE }),
      GateVisit.countDocuments({ status: GATE_VISIT_STATUS.INSIDE_YARD }),
      GateVisit.countDocuments({ entryTime: { $gte: todayStart, $lte: todayEnd } }),
      GateVisit.countDocuments({ exitTime: { $gte: todayStart, $lte: todayEnd } }),
      YardSlot.countDocuments({ status: YARD_SLOT_STATUS.AVAILABLE }),
      YardSlot.countDocuments({ status: YARD_SLOT_STATUS.OCCUPIED }),
      YardSlot.countDocuments({ status: YARD_SLOT_STATUS.BLOCKED }),
      DockAppointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: DOCK_APPOINTMENT_STATUS.SCHEDULED,
      }),
      DockAppointment.countDocuments({ status: DOCK_APPOINTMENT_STATUS.IN_PROGRESS }),
      Shipment.countDocuments({
        currentStatus: {
          $in: [
            SHIPMENT_STATUS.CREATED,
            SHIPMENT_STATUS.ARRIVED,
            SHIPMENT_STATUS.LOADING,
            SHIPMENT_STATUS.IN_TRANSIT,
            SHIPMENT_STATUS.UNLOADING,
          ],
        },
      }),
      Shipment.countDocuments({ currentStatus: SHIPMENT_STATUS.DELIVERED }),
    ]);

    // Usable slots denominator
    const usableSlots = availableSlots + occupiedSlots;
    const yardUtilization = usableSlots > 0 ? Math.round((occupiedSlots / usableSlots) * 100) : 0;

    // 2. Daily Entry / Exit trend for past 7 days
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      past7Days.push({ date: d, dayEnd, label: dayLabel });
    }

    const entryExitTrends = await Promise.all(
      past7Days.map(async ({ date, dayEnd, label }) => {
        const [entries, exits] = await Promise.all([
          GateVisit.countDocuments({ entryTime: { $gte: date, $lte: dayEnd } }),
          GateVisit.countDocuments({ exitTime: { $gte: date, $lte: dayEnd } }),
        ]);
        return { name: label, entries, exits };
      })
    );

    // 3. Shipment Status Distribution
    const shipmentStatuses = Object.values(SHIPMENT_STATUS);
    const shipmentDistribution = await Promise.all(
      shipmentStatuses.map(async (status) => {
        const count = await Shipment.countDocuments({ currentStatus: status });
        return { name: status, value: count };
      })
    );

    // 4. Upcoming Dock Appointments
    const upcomingAppointments = await DockAppointment.find({
      startDateTime: { $gte: now },
      status: DOCK_APPOINTMENT_STATUS.SCHEDULED,
    })
      .populate('dock', 'name code location')
      .populate({
        path: 'gateVisit',
        populate: [
          { path: 'vehicle', select: 'registrationNumber vehicleType' },
          { path: 'driver', select: 'fullName phoneNumber' },
        ],
      })
      .sort({ startDateTime: 1 })
      .limit(5);

    // 5. Recent Gate Visits
    const recentGateVisits = await GateVisit.find()
      .populate('vehicle', 'registrationNumber vehicleType')
      .populate('driver', 'fullName')
      .populate('assignedSlot', 'slotCode')
      .sort({ entryTime: -1 })
      .limit(6);

    // 6. Recent Shipment Events
    const recentShipmentEvents = await ShipmentEvent.find()
      .populate('shipment', 'trackingNumber orderNumber destination currentStatus')
      .populate('updatedBy', 'name')
      .sort({ timestamp: -1 })
      .limit(6);

    // 7. Critical Alerts
    // Driver License Alerts: Expired or Expiring in 30 days
    const thirtyDaysAhead = new Date(now);
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    const driverAlerts = await Driver.find({
      licenseExpiryDate: { $lte: thirtyDaysAhead },
    })
      .select('fullName licenseNumber licenseExpiryDate status')
      .sort({ licenseExpiryDate: 1 })
      .limit(10);

    const formattedDriverAlerts = driverAlerts.map((driver) => {
      const isExpired = new Date(driver.licenseExpiryDate) < now;
      return {
        id: driver._id,
        fullName: driver.fullName,
        licenseNumber: driver.licenseNumber,
        expiryDate: driver.licenseExpiryDate,
        type: isExpired ? 'CRITICAL_EXPIRED' : 'WARNING_EXPIRING',
        message: isExpired
          ? `Driver license ${driver.licenseNumber} for ${driver.fullName} expired on ${new Date(driver.licenseExpiryDate).toLocaleDateString()}.`
          : `Driver license for ${driver.fullName} will expire in ${Math.ceil((new Date(driver.licenseExpiryDate) - now) / (1000 * 60 * 60 * 24))} days.`,
      };
    });

    // Overdue Dock Appointments (Scheduled but startDateTime was in past)
    const overdueAppointments = await DockAppointment.find({
      status: DOCK_APPOINTMENT_STATUS.SCHEDULED,
      startDateTime: { $lt: now },
    })
      .populate('dock', 'name code')
      .populate({
        path: 'gateVisit',
        populate: { path: 'vehicle', select: 'registrationNumber' },
      })
      .limit(5);

    const formattedOverdueAlerts = overdueAppointments.map((appt) => ({
      id: appt._id,
      dockCode: appt.dock?.code,
      scheduledTime: `${appt.startTime} - ${appt.endTime}`,
      vehicle: appt.gateVisit?.vehicle?.registrationNumber || 'N/A',
      message: `Appointment at Dock ${appt.dock?.code || 'N/A'} is overdue (Scheduled for ${new Date(appt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
    }));

    return {
      cards: {
        totalActiveVehicles,
        vehiclesInsideYard,
        todayEntries,
        todayExits,
        availableSlots,
        occupiedSlots,
        blockedSlots,
        todayScheduledAppointments,
        appointmentsInProgress,
        activeShipments,
        deliveredShipments,
        yardUtilization,
      },
      charts: {
        entryExitTrends,
        shipmentDistribution: shipmentDistribution.filter((d) => d.value > 0),
        yardUtilizationRatio: [
          { name: 'Occupied', value: occupiedSlots },
          { name: 'Available', value: availableSlots },
          { name: 'Blocked', value: blockedSlots },
        ],
      },
      activities: {
        upcomingAppointments,
        recentGateVisits,
        recentShipmentEvents,
      },
      alerts: {
        driverLicenses: formattedDriverAlerts,
        overdueAppointments: formattedOverdueAlerts,
      },
    };
  }
}

module.exports = new DashboardService();
