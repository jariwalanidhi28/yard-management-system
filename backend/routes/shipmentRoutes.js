const express = require('express');
const router = express.Router();
const {
  getShipments,
  getShipmentById,
  createShipment,
  addShipmentEvent,
  getShipmentEvents,
  getPublicTracking,
} = require('../controllers/shipmentController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { shipmentRules, eventRules } = require('../validators/shipmentValidator');

// Public tracking (no auth required, restricted fields)
router.get('/track/:trackingNumber', getPublicTracking);

// Protected routes
router.use(protect);

router.route('/')
  .get(getShipments)
  .post(shipmentRules, validate, createShipment);

router.route('/:id')
  .get(getShipmentById);

router.route('/:id/events')
  .get(getShipmentEvents)
  .post(eventRules, validate, addShipmentEvent);

module.exports = router;
