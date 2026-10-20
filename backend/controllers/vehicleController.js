const vehicleService = require('../services/vehicleService');

// @desc    Get all vehicles (paginated, filtered, sorted)
// @route   GET /api/v1/vehicles
// @access  Private
const getVehicles = async (req, res, next) => {
  try {
    const result = await vehicleService.getVehicles(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle details with visit and shipment history
// @route   GET /api/v1/vehicles/:id
// @access  Private
const getVehicleById = async (req, res, next) => {
  try {
    const result = await vehicleService.getVehicleById(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new vehicle
// @route   POST /api/v1/vehicles
// @access  Private
const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PATCH /api/v1/vehicles/:id
// @access  Private
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or archive vehicle
// @route   DELETE /api/v1/vehicles/:id
// @access  Private
const deleteVehicle = async (req, res, next) => {
  try {
    const result = await vehicleService.deleteVehicle(req.params.id);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
