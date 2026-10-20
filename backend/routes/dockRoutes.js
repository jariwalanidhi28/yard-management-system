const express = require('express');
const router = express.Router();
const {
  getDocks,
  getDockById,
  createDock,
  updateDock,
  deleteDock,
  getAppointments,
  getAppointmentById,
  createAppointment,
  startAppointment,
  completeAppointment,
  cancelAppointment,
} = require('../controllers/dockController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { dockRules, appointmentRules } = require('../validators/dockValidator');
const { ROLES } = require('../config/constants');

// Docks CRUD
router.route('/docks')
  .get(protect, getDocks)
  .post(protect, authorize(ROLES.ADMIN), dockRules, validate, createDock);

router.route('/docks/:id')
  .get(protect, getDockById)
  .patch(protect, authorize(ROLES.ADMIN), updateDock)
  .delete(protect, authorize(ROLES.ADMIN), deleteDock);

// Dock Appointments
router.route('/dock-appointments')
  .get(protect, getAppointments)
  .post(protect, appointmentRules, validate, createAppointment);

router.route('/dock-appointments/:id')
  .get(protect, getAppointmentById);

router.post('/dock-appointments/:id/start', protect, startAppointment);
router.post('/dock-appointments/:id/complete', protect, completeAppointment);
router.post('/dock-appointments/:id/cancel', protect, cancelAppointment);

module.exports = router;
