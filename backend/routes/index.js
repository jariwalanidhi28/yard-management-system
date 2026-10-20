const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const staffRoutes = require('./staffRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const driverRoutes = require('./driverRoutes');
const gateVisitRoutes = require('./gateVisitRoutes');
const yardRoutes = require('./yardRoutes');
const dockRoutes = require('./dockRoutes');
const shipmentRoutes = require('./shipmentRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/gate-visits', gateVisitRoutes);
router.use('/', yardRoutes); // /yard-zones, /yard-slots, /yard-movements, /yard-map
router.use('/', dockRoutes); // /docks, /dock-appointments
router.use('/shipments', shipmentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
