const dashboardService = require('../services/dashboardService');

// @desc    Get complete real-time dashboard data
// @route   GET /api/v1/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardMetrics();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};
