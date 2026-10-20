const express = require('express');
const router = express.Router();
const {
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getYardMap,
  allocateSlot,
  releaseSlot,
  getMovements,
} = require('../controllers/yardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { zoneRules, slotRules, allocateRules } = require('../validators/yardValidator');
const { ROLES } = require('../config/constants');

// Visual Yard Map
router.get('/yard-map', protect, getYardMap);

// Movements Audit Trail
router.get('/yard-movements', protect, getMovements);

// Yard Zones
router.route('/yard-zones')
  .get(protect, getZones)
  .post(protect, authorize(ROLES.ADMIN), zoneRules, validate, createZone);

router.route('/yard-zones/:id')
  .get(protect, getZoneById)
  .patch(protect, authorize(ROLES.ADMIN), updateZone)
  .delete(protect, authorize(ROLES.ADMIN), deleteZone);

// Yard Slots
router.route('/yard-slots')
  .get(protect, getSlots)
  .post(protect, authorize(ROLES.ADMIN), slotRules, validate, createSlot);

router.route('/yard-slots/:id')
  .patch(protect, authorize(ROLES.ADMIN), updateSlot)
  .delete(protect, authorize(ROLES.ADMIN), deleteSlot);

router.post('/yard-slots/:id/allocate', protect, allocateRules, validate, allocateSlot);
router.post('/yard-slots/:id/release', protect, releaseSlot);

module.exports = router;
