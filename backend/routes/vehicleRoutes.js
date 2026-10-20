const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { vehicleRules } = require('../validators/vehicleValidator');

router.use(protect);

router.route('/')
  .get(getVehicles)
  .post(vehicleRules, validate, createVehicle);

router.route('/:id')
  .get(getVehicleById)
  .patch(updateVehicle)
  .delete(deleteVehicle);

module.exports = router;
