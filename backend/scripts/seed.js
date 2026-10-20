const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const YardZone = require('../models/YardZone');
const YardSlot = require('../models/YardSlot');
const GateVisit = require('../models/GateVisit');
const YardMovement = require('../models/YardMovement');
const Dock = require('../models/Dock');
const DockAppointment = require('../models/DockAppointment');
const Shipment = require('../models/Shipment');
const ShipmentEvent = require('../models/ShipmentEvent');
const {
  ROLES,
  DRIVER_STATUS,
  VEHICLE_STATUS,
  YARD_SLOT_STATUS,
  GATE_VISIT_STATUS,
  DOCK_STATUS,
  DOCK_APPOINTMENT_STATUS,
  SHIPMENT_STATUS,
  YARD_MOVEMENT_ACTIONS,
} = require('../config/constants');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yms_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Driver.deleteMany({}),
      Vehicle.deleteMany({}),
      YardZone.deleteMany({}),
      YardSlot.deleteMany({}),
      GateVisit.deleteMany({}),
      YardMovement.deleteMany({}),
      Dock.deleteMany({}),
      DockAppointment.deleteMany({}),
      Shipment.deleteMany({}),
      ShipmentEvent.deleteMany({}),
    ]);

    console.log('Seeding initial users...');
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
    const admin = await User.create({
      name: process.env.ADMIN_DEFAULT_NAME || 'System Administrator',
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@yms.local',
      password: adminPassword,
      role: ROLES.ADMIN,
      isActive: true,
    });

    const staff1 = await User.create({
      name: 'John Gatekeeper',
      email: 'staff1@yms.local',
      password: 'Staff@123456',
      role: ROLES.STAFF,
      isActive: true,
    });

    const staff2 = await User.create({
      name: 'Sarah Yardmaster',
      email: 'staff2@yms.local',
      password: 'Staff@123456',
      role: ROLES.STAFF,
      isActive: true,
    });

    console.log('Seeding drivers...');
    const now = new Date();
    const futureDate = new Date();
    futureDate.setFullYear(now.getFullYear() + 2);

    const expiringDate = new Date();
    expiringDate.setDate(now.getDate() + 15); // Expiring soon in 15 days

    const expiredDate = new Date();
    expiredDate.setDate(now.getDate() - 10); // Expired 10 days ago

    const drivers = await Driver.create([
      {
        fullName: 'Michael Torres',
        phoneNumber: '+1-555-0101',
        email: 'michael.t@freight.com',
        licenseNumber: 'CDL-TX-998811',
        licenseExpiryDate: futureDate,
        address: '450 Industrial Blvd, Houston, TX',
        status: DRIVER_STATUS.ACTIVE,
      },
      {
        fullName: 'David Kowalski',
        phoneNumber: '+1-555-0102',
        email: 'd.kowalski@logistics.net',
        licenseNumber: 'CDL-IL-772233',
        licenseExpiryDate: expiringDate, // Alert warning
        address: '128 Warehouse Rd, Chicago, IL',
        status: DRIVER_STATUS.ACTIVE,
      },
      {
        fullName: 'Robert Chen',
        phoneNumber: '+1-555-0103',
        email: 'rchen@transport.org',
        licenseNumber: 'CDL-CA-445566',
        licenseExpiryDate: expiredDate, // Expired alert
        address: '77 Harbour Way, Long Beach, CA',
        status: DRIVER_STATUS.ACTIVE,
      },
      {
        fullName: 'Marcus Vance',
        phoneNumber: '+1-555-0104',
        email: 'm.vance@vancefreight.com',
        licenseNumber: 'CDL-GA-332211',
        licenseExpiryDate: futureDate,
        address: '900 Logistics Way, Atlanta, GA',
        status: DRIVER_STATUS.ACTIVE,
      },
    ]);

    console.log('Seeding vehicles...');
    const vehicles = await Vehicle.create([
      {
        registrationNumber: 'TRK-9021',
        vehicleType: 'Semi-Trailer',
        makeModel: 'Freightliner Cascadia 2022',
        capacity: 25,
        capacityUnit: 'Tons',
        assignedDriver: drivers[0]._id,
        status: VEHICLE_STATUS.ACTIVE,
      },
      {
        registrationNumber: 'TRK-4410',
        vehicleType: 'Box Truck',
        makeModel: 'Peterbilt 579',
        capacity: 18,
        capacityUnit: 'Tons',
        assignedDriver: drivers[1]._id,
        status: VEHICLE_STATUS.ACTIVE,
      },
      {
        registrationNumber: 'CNT-8820',
        vehicleType: 'Container Truck',
        makeModel: 'Volvo VNL 860',
        capacity: 32,
        capacityUnit: 'Tons',
        assignedDriver: drivers[2]._id,
        status: VEHICLE_STATUS.ACTIVE,
      },
      {
        registrationNumber: 'FLT-1199',
        vehicleType: 'Flatbed',
        makeModel: 'Kenworth T680',
        capacity: 22,
        capacityUnit: 'Tons',
        assignedDriver: drivers[3]._id,
        status: VEHICLE_STATUS.ACTIVE,
      },
    ]);

    console.log('Seeding yard zones and parking slots...');
    const zoneNorth = await YardZone.create({
      name: 'North Inbound Staging',
      code: 'ZONE-A',
      description: 'Staging area for heavy inbound freight and container chassis',
      isActive: true,
    });

    const zoneSouth = await YardZone.create({
      name: 'South Outbound Loading',
      code: 'ZONE-B',
      description: 'Outbound dispatch parking and express cross-docking slots',
      isActive: true,
    });

    const zoneReefer = await YardZone.create({
      name: 'Cold Storage / Reefer Yard',
      code: 'ZONE-C',
      description: 'Electrified parking slots for temperature-controlled reefer trailers',
      isActive: true,
    });

    // Create slots for Zone A
    const slotA1 = await YardSlot.create({
      slotCode: 'A-01',
      zone: zoneNorth._id,
      slotType: 'Standard',
      status: YARD_SLOT_STATUS.OCCUPIED,
      notes: 'Occupied by TRK-9021',
    });

    const slotA2 = await YardSlot.create({
      slotCode: 'A-02',
      zone: zoneNorth._id,
      slotType: 'Standard',
      status: YARD_SLOT_STATUS.AVAILABLE,
    });

    const slotA3 = await YardSlot.create({
      slotCode: 'A-03',
      zone: zoneNorth._id,
      slotType: 'Oversized',
      status: YARD_SLOT_STATUS.BLOCKED,
      notes: 'Pavement resurfacing maintenance',
    });

    // Create slots for Zone B
    const slotB1 = await YardSlot.create({
      slotCode: 'B-01',
      zone: zoneSouth._id,
      slotType: 'Standard',
      status: YARD_SLOT_STATUS.AVAILABLE,
    });

    const slotB2 = await YardSlot.create({
      slotCode: 'B-02',
      zone: zoneSouth._id,
      slotType: 'Standard',
      status: YARD_SLOT_STATUS.AVAILABLE,
    });

    // Create slots for Zone C
    const slotC1 = await YardSlot.create({
      slotCode: 'C-01',
      zone: zoneReefer._id,
      slotType: 'Reefer',
      status: YARD_SLOT_STATUS.AVAILABLE,
    });

    console.log('Seeding docks...');
    const dock1 = await Dock.create({
      name: 'Inbound Dock 01',
      code: 'DCK-01',
      dockType: 'Unloading',
      location: 'Terminal A - Bay 1-4',
      status: DOCK_STATUS.ACTIVE,
      operationalHours: { open: '06:00', close: '22:00' },
    });

    const dock2 = await Dock.create({
      name: 'Outbound Express Dock 02',
      code: 'DCK-02',
      dockType: 'Loading',
      location: 'Terminal B - Bay 5-8',
      status: DOCK_STATUS.ACTIVE,
      operationalHours: { open: '06:00', close: '22:00' },
    });

    const dock3 = await Dock.create({
      name: 'Cold Storage Dock 03',
      code: 'DCK-03',
      dockType: 'Dual',
      location: 'Cold Chain Wing - Bay 9',
      status: DOCK_STATUS.MAINTENANCE,
      operationalHours: { open: '08:00', close: '20:00' },
    });

    console.log('Seeding gate visits...');
    // Active visit inside yard
    const visit1 = await GateVisit.create({
      gatePassNumber: 'GP-20261019-0001',
      vehicle: vehicles[0]._id,
      driver: drivers[0]._id,
      entryTime: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hrs ago
      status: GATE_VISIT_STATUS.INSIDE_YARD,
      assignedSlot: slotA1._id,
      shipmentReference: 'PO-98441-A',
      purpose: 'Unloading',
      recordedByEntry: staff1._id,
    });

    // Link slotA1 to visit1
    slotA1.currentVisit = visit1._id;
    slotA1.currentVehicle = vehicles[0]._id;
    await slotA1.save();

    await YardMovement.create({
      gateVisit: visit1._id,
      vehicle: vehicles[0]._id,
      action: YARD_MOVEMENT_ACTIONS.ALLOCATION,
      toSlot: slotA1._id,
      reason: 'Assigned upon gate check-in',
      performedBy: staff1._id,
      timestamp: visit1.entryTime,
    });

    // Completed visit earlier today
    const visit2 = await GateVisit.create({
      gatePassNumber: 'GP-20261019-0002',
      vehicle: vehicles[3]._id,
      driver: drivers[3]._id,
      entryTime: new Date(Date.now() - 300 * 60 * 1000), // 5 hrs ago
      exitTime: new Date(Date.now() - 180 * 60 * 1000), // 3 hrs ago
      status: GATE_VISIT_STATUS.EXITED,
      shipmentReference: 'PO-77120-X',
      purpose: 'Loading',
      recordedByEntry: staff1._id,
      recordedByExit: staff2._id,
    });

    console.log('Seeding dock appointments...');
    const apptDate = new Date();
    const apptStart = new Date(apptDate);
    apptStart.setHours(16, 0, 0, 0);
    const apptEnd = new Date(apptDate);
    apptEnd.setHours(17, 30, 0, 0);

    const appointment1 = await DockAppointment.create({
      dock: dock1._id,
      gateVisit: visit1._id,
      appointmentDate: apptDate,
      startTime: '16:00',
      endTime: '17:30',
      startDateTime: apptStart,
      endDateTime: apptEnd,
      operationType: 'Unloading',
      status: DOCK_APPOINTMENT_STATUS.SCHEDULED,
      createdBy: staff1._id,
      notes: 'Palletized electronics batch',
    });

    console.log('Seeding shipments and tracking events...');
    const shipment1 = await Shipment.create({
      trackingNumber: 'TRK-20261019-0001',
      orderNumber: 'ORD-88129',
      consignee: 'Apex Retail Distribution Hub',
      origin: 'Chicago Distribution Center',
      destination: 'Dallas Logistics Yard',
      description: 'High-density lithium battery modules and accessories',
      weight: 14500,
      weightUnit: 'Kg',
      quantity: 24,
      gateVisit: visit1._id,
      currentStatus: SHIPMENT_STATUS.ARRIVED,
      createdBy: admin._id,
    });

    await ShipmentEvent.create([
      {
        shipment: shipment1._id,
        status: SHIPMENT_STATUS.CREATED,
        location: 'Chicago Distribution Center',
        notes: 'Shipment created and assigned to trailer',
        updatedBy: admin._id,
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      {
        shipment: shipment1._id,
        status: SHIPMENT_STATUS.IN_TRANSIT,
        location: 'Interstate I-55 Corridor',
        notes: 'Cleared transit toll checkpoint',
        updatedBy: staff1._id,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        shipment: shipment1._id,
        status: SHIPMENT_STATUS.ARRIVED,
        location: 'Dallas Logistics Yard - Gate 1',
        notes: 'Arrived at destination yard facility. Gate pass GP-20261019-0001 issued.',
        updatedBy: staff1._id,
        timestamp: visit1.entryTime,
      },
    ]);

    const shipment2 = await Shipment.create({
      trackingNumber: 'TRK-20261019-0002',
      orderNumber: 'ORD-90234',
      consignee: 'Evergreen Fresh Grocers',
      origin: 'Salinas Valley Cold Facility',
      destination: 'Dallas Logistics Yard',
      description: 'Organic refrigerated produce crates',
      weight: 18200,
      weightUnit: 'Kg',
      quantity: 36,
      currentStatus: SHIPMENT_STATUS.IN_TRANSIT,
      createdBy: admin._id,
    });

    await ShipmentEvent.create({
      shipment: shipment2._id,
      status: SHIPMENT_STATUS.IN_TRANSIT,
      location: 'West Texas Waypoint',
      notes: 'In-transit temperature logged at 34F',
      updatedBy: staff2._id,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    });

    console.log('=====================================================');
    console.log('  Database Seeding Complete Successfully!');
    console.log('=====================================================');
    console.log('Demo Credentials for Development:');
    console.log(`  Admin Account : ${admin.email} / ${adminPassword}`);
    console.log('  Staff Account : staff1@yms.local / Staff@123456');
    console.log('  Staff Account : staff2@yms.local / Staff@123456');
    console.log('=====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
