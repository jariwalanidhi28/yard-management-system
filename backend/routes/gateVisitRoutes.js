const express = require('express');
const router = express.Router();
const {
  getGateVisits,
  getGateVisitById,
  createGateEntry,
  recordExit,
} = require('../controllers/gateVisitController');
const { reassignSlot } = require('../controllers/yardController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { gateEntryRules } = require('../validators/gateVisitValidator');
const { reassignRules } = require('../validators/yardValidator');

router.use(protect);

router.route('/')
  .get(getGateVisits)
  .post(gateEntryRules, validate, createGateEntry);

router.route('/:id')
  .get(getGateVisitById);

router.post('/:id/exit', recordExit);
router.post('/:id/reassign-slot', reassignRules, validate, reassignSlot);

module.exports = router;
