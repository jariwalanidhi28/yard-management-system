const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driverController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { driverRules } = require('../validators/driverValidator');

router.use(protect);

router.route('/')
  .get(getDrivers)
  .post(driverRules, validate, createDriver);

router.route('/:id')
  .get(getDriverById)
  .patch(updateDriver)
  .delete(deleteDriver);

module.exports = router;
