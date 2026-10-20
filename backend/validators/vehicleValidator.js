const { body, param } = require('express-validator');
const { VEHICLE_TYPES, VEHICLE_STATUS, CAPACITY_UNITS } = require('../config/constants');

const vehicleRules = [
  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle registration number is required')
    .isLength({ min: 2, max: 30 })
    .withMessage('Registration number must be between 2 and 30 characters'),
  body('vehicleType')
    .trim()
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isIn(VEHICLE_TYPES)
    .withMessage(`Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}`),
  body('makeModel')
    .trim()
    .notEmpty()
    .withMessage('Make and model are required'),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isFloat({ min: 0.01 })
    .withMessage('Capacity must be greater than zero'),
  body('capacityUnit')
    .optional()
    .isIn(CAPACITY_UNITS)
    .withMessage(`Capacity unit must be one of: ${CAPACITY_UNITS.join(', ')}`),
  body('assignedDriver')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Assigned driver must be a valid ID'),
  body('status')
    .optional()
    .isIn(Object.values(VEHICLE_STATUS))
    .withMessage(`Status must be one of: ${Object.values(VEHICLE_STATUS).join(', ')}`),
];

module.exports = { vehicleRules };
