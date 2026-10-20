const { body } = require('express-validator');
const { DOCK_TYPES, DOCK_STATUS, DOCK_OPERATION_TYPES, DOCK_APPOINTMENT_STATUS } = require('../config/constants');

const dockRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Dock name is required')
    .isLength({ max: 100 }),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Dock code is required')
    .isLength({ min: 1, max: 20 }),
  body('dockType')
    .optional()
    .isIn(DOCK_TYPES)
    .withMessage(`Dock type must be one of: ${DOCK_TYPES.join(', ')}`),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 150 }),
  body('status')
    .optional()
    .isIn(Object.values(DOCK_STATUS))
    .withMessage(`Status must be one of: ${Object.values(DOCK_STATUS).join(', ')}`),
];

const appointmentRules = [
  body('dock')
    .notEmpty()
    .withMessage('Dock ID is required')
    .isMongoId()
    .withMessage('Invalid dock ID'),
  body('gateVisit')
    .notEmpty()
    .withMessage('Gate visit ID is required')
    .isMongoId()
    .withMessage('Invalid gate visit ID'),
  body('appointmentDate')
    .notEmpty()
    .withMessage('Appointment date is required')
    .isISO8601()
    .withMessage('Appointment date must be a valid date'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required (format HH:mm)')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format (e.g. 09:30)'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required (format HH:mm)')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format (e.g. 10:30)'),
  body('operationType')
    .optional()
    .isIn(DOCK_OPERATION_TYPES)
    .withMessage(`Operation type must be one of: ${DOCK_OPERATION_TYPES.join(', ')}`),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }),
];

module.exports = {
  dockRules,
  appointmentRules,
};
