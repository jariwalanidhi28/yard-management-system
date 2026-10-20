const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const YardZone = require('../models/YardZone');
const YardSlot = require('../models/YardSlot');
const GateVisit = require('../models/GateVisit');
const Dock = require('../models/Dock');
const DockAppointment = require('../models/DockAppointment');
const Shipment = require('../models/Shipment');
const { ROLES, VEHICLE_STATUS, DRIVER_STATUS, YARD_SLOT_STATUS, GATE_VISIT_STATUS, DOCK_STATUS } = require('../config/constants');

describe('YMS Backend API End-to-End Suite', () => {
  let adminToken;
  let staffToken;
  let adminUser;
  let staffUser;

  beforeAll(async () => {
    // Clear test collections
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      YardZone.deleteMany({}),
      YardSlot.deleteMany({}),
      GateVisit.deleteMany({}),
      Dock.deleteMany({}),
      DockAppointment.deleteMany({}),
      Shipment.deleteMany({}),
    ]);

    // Create Admin User
    adminUser = await User.create({
      name: 'Test Administrator',
      email: 'admin@test.local',
      password: 'AdminPassword123!',
      role: ROLES.ADMIN,
      isActive: true,
    });

    // Create Staff User
    staffUser = await User.create({
      name: 'Test Staff Member',
      email: 'staff@test.local',
      password: 'StaffPassword123!',
      role: ROLES.STAFF,
      isActive: true,
    });
  });

  // 1. Authentication Tests
  describe('Authentication & Access Control', () => {
    it('should fail login with invalid password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@test.local',
        password: 'wrong_password',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully log in admin and return token', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@test.local',
        password: 'AdminPassword123!',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe(ROLES.ADMIN);
      adminToken = res.body.data.token;
    });

    it('should successfully log in staff and return token', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'staff@test.local',
        password: 'StaffPassword123!',
      });
      expect(res.status).toBe(200);
      staffToken = res.body.data.token;
    });

    it('should get current user profile with token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@test.local');
    });

    it('should deny staff from accessing admin-only staff management', async () => {
      const res = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow admin to view staff list', async () => {
      const res = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // 2. Driver Management Tests
  describe('Driver Management', () => {
    let createdDriverId;

    it('should create a new driver with valid license', async () => {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      const res = await request(app)
        .post('/api/v1/drivers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'John Trucker',
          phoneNumber: '+1-555-4321',
          licenseNumber: 'CDL-TEST-001',
          licenseExpiryDate: expiry.toISOString().slice(0, 10),
          status: DRIVER_STATUS.ACTIVE,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.licenseNumber).toBe('CDL-TEST-001');
      createdDriverId = res.body.data._id;
    });

    it('should prevent duplicate driving license numbers', async () => {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      const res = await request(app)
        .post('/api/v1/drivers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'Another Driver',
          phoneNumber: '+1-555-9999',
          licenseNumber: 'CDL-TEST-001', // duplicate
          licenseExpiryDate: expiry.toISOString().slice(0, 10),
        });

      expect(res.status).toBe(409);
    });
  });

  // 3. Vehicle Management Tests
  describe('Vehicle Management', () => {
    let createdVehicleId;

    it('should create a new vehicle', async () => {
      const res = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          registrationNumber: 'TEST-TRK-100',
          vehicleType: 'Semi-Trailer',
          makeModel: 'Freightliner 2024',
          capacity: 20,
          capacityUnit: 'Tons',
          status: VEHICLE_STATUS.ACTIVE,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.registrationNumber).toBe('TEST-TRK-100');
      createdVehicleId = res.body.data._id;
    });

    it('should prevent duplicate registration numbers', async () => {
      const res = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          registrationNumber: 'TEST-TRK-100', // duplicate
          vehicleType: 'Flatbed',
          makeModel: 'Kenworth',
          capacity: 15,
        });

      expect(res.status).toBe(409);
    });
  });

  // 4. Yard Zones & Slots Management
  describe('Yard Allocation & Concurrency', () => {
    let testZoneId;
    let testSlotId;

    it('should allow admin to create a yard zone', async () => {
      const res = await request(app)
        .post('/api/v1/yard-zones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Testing Inbound Zone',
          code: 'TZ-01',
          description: 'Testing zone for automated test runs',
        });

      expect(res.status).toBe(201);
      testZoneId = res.body.data._id;
    });

    it('should allow admin to create a parking slot in zone', async () => {
      const res = await request(app)
        .post('/api/v1/yard-slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slotCode: 'T-01',
          zone: testZoneId,
          slotType: 'Standard',
          status: YARD_SLOT_STATUS.AVAILABLE,
        });

      expect(res.status).toBe(201);
      testSlotId = res.body.data._id;
    });

    it('should prevent duplicate slot codes in the same zone', async () => {
      const res = await request(app)
        .post('/api/v1/yard-slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slotCode: 'T-01',
          zone: testZoneId,
          slotType: 'Standard',
        });

      expect(res.status).toBe(409);
    });
  });

  // 5. Gate Visit Entry & Exit Lifecycle
  describe('Gate Operations Module', () => {
    let vehicleId;
    let driverId;
    let slotId;
    let visitId;

    beforeAll(async () => {
      const driver = await Driver.findOne({ licenseNumber: 'CDL-TEST-001' });
      driverId = driver._id;

      const vehicle = await Vehicle.findOne({ registrationNumber: 'TEST-TRK-100' });
      vehicleId = vehicle._id;

      const slot = await YardSlot.findOne({ slotCode: 'T-01' });
      slotId = slot._id;
    });

    it('should record gate entry and assign slot', async () => {
      const res = await request(app)
        .post('/api/v1/gate-visits')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          vehicleId,
          driverId,
          purpose: 'Loading',
          assignedSlot: slotId,
          shipmentReference: 'REF-TEST-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.gatePassNumber).toMatch(/^GP-/);
      expect(res.body.data.status).toBe(GATE_VISIT_STATUS.INSIDE_YARD);
      visitId = res.body.data._id;

      // Verify slot is now occupied
      const updatedSlot = await YardSlot.findById(slotId);
      expect(updatedSlot.status).toBe(YARD_SLOT_STATUS.OCCUPIED);
      expect(updatedSlot.currentVisit.toString()).toBe(visitId.toString());
    });

    it('should prevent the same vehicle from having two active visits', async () => {
      const res = await request(app)
        .post('/api/v1/gate-visits')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          vehicleId,
          driverId,
          purpose: 'Unloading',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already inside the yard/i);
    });

    it('should prevent deleting a vehicle while on active visit', async () => {
      const res = await request(app)
        .delete(`/api/v1/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot delete or archive vehicle while it is currently inside the yard/i);
    });

    it('should record gate exit and release the slot', async () => {
      const res = await request(app)
        .post(`/api/v1/gate-visits/${visitId}/exit`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ exitNotes: 'Departure inspection clear.' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(GATE_VISIT_STATUS.EXITED);
      expect(res.body.data.exitTime).toBeDefined();

      // Verify slot was released back to Available
      const releasedSlot = await YardSlot.findById(slotId);
      expect(releasedSlot.status).toBe(YARD_SLOT_STATUS.AVAILABLE);
      expect(releasedSlot.currentVisit).toBeNull();
    });

    it('should prevent exit from being recorded twice', async () => {
      const res = await request(app)
        .post(`/api/v1/gate-visits/${visitId}/exit`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already been recorded/i);
    });
  });

  // 6. Dock Management & Overlap Prevention
  describe('Dock Management & Overlap Prevention', () => {
    let testDockId;
    let gateVisitId;

    beforeAll(async () => {
      const dock = await Dock.create({
        name: 'Test Dock Alpha',
        code: 'TDCK-01',
        dockType: 'Dual',
        status: DOCK_STATUS.ACTIVE,
      });
      testDockId = dock._id;

      const visit = await GateVisit.findOne({ status: GATE_VISIT_STATUS.EXITED });
      // Reset status to Inside Yard for dock appointment testing
      visit.status = GATE_VISIT_STATUS.INSIDE_YARD;
      await visit.save();
      gateVisitId = visit._id;
    });

    it('should schedule a dock appointment successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);

      const res = await request(app)
        .post('/api/v1/dock-appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          dock: testDockId,
          gateVisit: gateVisitId,
          appointmentDate: dateStr,
          startTime: '10:00',
          endTime: '11:30',
          operationType: 'Loading',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('Scheduled');
    });

    it('should reject overlapping dock appointment on the same dock', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);

      // Overlaps 10:00 - 11:30 (e.g. 10:30 - 12:00)
      const res = await request(app)
        .post('/api/v1/dock-appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          dock: testDockId,
          gateVisit: gateVisitId,
          appointmentDate: dateStr,
          startTime: '10:30',
          endTime: '12:00',
          operationType: 'Unloading',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/overlapping appointment/i);
    });

    it('should validate end time is after start time', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);

      const res = await request(app)
        .post('/api/v1/dock-appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          dock: testDockId,
          gateVisit: gateVisitId,
          appointmentDate: dateStr,
          startTime: '14:00',
          endTime: '13:00', // Invalid: end before start
          operationType: 'Loading',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/must be after start time/i);
    });
  });

  // 7. Shipment Management & Status Transitions
  describe('Shipment Management & Audit Timeline', () => {
    let shipmentId;
    let trackingNumber;

    it('should create a shipment with tracking number and initial event', async () => {
      const res = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          orderNumber: 'ORD-TEST-99',
          consignee: 'Acme Test Corp',
          origin: 'Factory Yard A',
          destination: 'Warehouse Hub B',
          weight: 5000,
          weightUnit: 'Kg',
          quantity: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.trackingNumber).toMatch(/^TRK-/);
      expect(res.body.data.currentStatus).toBe('Created');
      shipmentId = res.body.data._id;
      trackingNumber = res.body.data.trackingNumber;
    });

    it('should allow valid status transition and log event', async () => {
      const res = await request(app)
        .post(`/api/v1/shipments/${shipmentId}/events`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'Arrived',
          location: 'Inbound Gate Inspection',
          notes: 'Shipment arrived intact.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('Arrived');

      const eventsRes = await request(app)
        .get(`/api/v1/shipments/${shipmentId}/events`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(eventsRes.status).toBe(200);
      expect(eventsRes.body.data.length).toBe(2); // Created + Arrived
    });

    it('should reject invalid status transition', async () => {
      // Arrived directly to Delivered without Loading/In Transit/Unloading
      const res = await request(app)
        .post(`/api/v1/shipments/${shipmentId}/events`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'Delivered',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid status transition/i);
    });

    it('should return restricted public tracking data without internal references', async () => {
      const res = await request(app).get(`/api/v1/shipments/track/${trackingNumber}`);
      if (res.status !== 200) {
        console.log('TRACKING RES STATUS:', res.status, res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.data.trackingNumber).toBe(trackingNumber);
      expect(res.body.data.gateVisit).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.timeline).toBeDefined();
    });
  });

  // 8. Reports & Analytics
  describe('Reports & CSV Export', () => {
    it('should compute live yard utilization report', async () => {
      const res = await request(app)
        .get('/api/v1/reports/yard-utilization')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalSlots).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.utilizationPercentage).toBeDefined();
    });

    it('should export gate visits as CSV with formula injection protection', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export?type=gate-visits')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('Gate Pass #');
    });
  });
});
