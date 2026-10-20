const driverService = require('../services/driverService');

// @desc    Get all drivers (paginated, filtered, sorted)
// @route   GET /api/v1/drivers
// @access  Private
const getDrivers = async (req, res, next) => {
  try {
    const result = await driverService.getDrivers(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get driver details with assigned vehicles and visit history
// @route   GET /api/v1/drivers/:id
// @access  Private
const getDriverById = async (req, res, next) => {
  try {
    const result = await driverService.getDriverById(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new driver
// @route   POST /api/v1/drivers
// @access  Private
const createDriver = async (req, res, next) => {
  try {
    const driver = await driverService.createDriver(req.body);
    res.status(201).json({
      success: true,
      message: 'Driver profile registered successfully.',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver
// @route   PATCH /api/v1/drivers/:id
// @access  Private
const updateDriver = async (req, res, next) => {
  try {
    const driver = await driverService.updateDriver(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Driver profile updated successfully.',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or deactivate driver
// @route   DELETE /api/v1/drivers/:id
// @access  Private
const deleteDriver = async (req, res, next) => {
  try {
    const result = await driverService.deleteDriver(req.params.id);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
};
