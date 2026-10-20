const { body } = require('express-validator');
const { SHIPMENT_STATUS, SHIPMENT_WEIGHT_UNITS } = require('../config/constants');

const shipmentRules = [
  body('orderNumber')
    .trim()
    .notEmpty()
    .withMessage('Order or reference number is required'),
  body('consignee')
    .trim()
    .notEmpty()
    .withMessage('Consignee is required'),
  body('origin')
    .trim()
    .notEmpty()
    .withMessage('Origin is required'),
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required'),
  body('weight')
    .notEmpty()
    .withMessage('Weight is required')
    .isFloat({ min: 0 })
    .withMessage('Weight must be non-negative'),
  body('weightUnit')
    .optional()
    .isIn(SHIPMENT_WEIGHT_UNITS)
    .withMessage(`Weight unit must be one of: ${SHIPMENT_WEIGHT_UNITS.join(', ')}`),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer >= 1'),
  body('gateVisit')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Gate visit must be a valid ID'),
  body('currentStatus')
    .optional()
    .isIn(Object.values(SHIPMENT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(SHIPMENT_STATUS).join(', ')}`),
];

const eventRules = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(SHIPMENT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(SHIPMENT_STATUS).join(', ')}`),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 150 }),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }),
];

module.exports = {
  shipmentRules,
  eventRules,
};
