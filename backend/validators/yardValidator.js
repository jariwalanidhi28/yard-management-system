const { body } = require('express-validator');
const { YARD_SLOT_TYPES, YARD_SLOT_STATUS } = require('../config/constants');

const zoneRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Zone name is required')
    .isLength({ max: 100 }),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Zone code is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Zone code must be between 1 and 20 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const slotRules = [
  body('slotCode')
    .trim()
    .notEmpty()
    .withMessage('Slot code is required')
    .isLength({ min: 1, max: 20 }),
  body('zone')
    .notEmpty()
    .withMessage('Zone ID is required')
    .isMongoId()
    .withMessage('Zone must be a valid ID'),
  body('slotType')
    .optional()
    .isIn(YARD_SLOT_TYPES)
    .withMessage(`Slot type must be one of: ${YARD_SLOT_TYPES.join(', ')}`),
  body('status')
    .optional()
    .isIn(Object.values(YARD_SLOT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(YARD_SLOT_STATUS).join(', ')}`),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 300 }),
];

const allocateRules = [
  body('visitId')
    .notEmpty()
    .withMessage('Gate visit ID is required')
    .isMongoId()
    .withMessage('Invalid gate visit ID'),
];

const reassignRules = [
  body('newSlotId')
    .notEmpty()
    .withMessage('New slot ID is required')
    .isMongoId()
    .withMessage('Invalid slot ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 300 }),
];

module.exports = {
  zoneRules,
  slotRules,
  allocateRules,
  reassignRules,
};
