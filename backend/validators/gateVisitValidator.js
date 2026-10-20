const { body } = require('express-validator');
const { GATE_VISIT_PURPOSES } = require('../config/constants');

const gateEntryRules = [
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle is required')
    .isMongoId()
    .withMessage('Vehicle must be a valid ID'),
  body('driverId')
    .notEmpty()
    .withMessage('Driver is required')
    .isMongoId()
    .withMessage('Driver must be a valid ID'),
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose is required')
    .isIn(GATE_VISIT_PURPOSES)
    .withMessage(`Purpose must be one of: ${GATE_VISIT_PURPOSES.join(', ')}`),
  body('assignedSlot')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Assigned slot must be a valid ID'),
  body('shipmentReference')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }),
];

module.exports = { gateEntryRules };
