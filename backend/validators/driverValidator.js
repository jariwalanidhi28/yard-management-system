const { body } = require('express-validator');
const { DRIVER_STATUS } = require('../config/constants');

const driverRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Driver full name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Full name must be between 2 and 120 characters'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('Driving license number is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('License number must be between 3 and 50 characters'),
  body('licenseExpiryDate')
    .notEmpty()
    .withMessage('License expiry date is required')
    .isISO8601()
    .withMessage('License expiry date must be a valid date (YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(Object.values(DRIVER_STATUS))
    .withMessage(`Status must be one of: ${Object.values(DRIVER_STATUS).join(', ')}`),
];

module.exports = { driverRules };
