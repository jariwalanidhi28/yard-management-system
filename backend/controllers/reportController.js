const reportService = require('../services/reportService');

// @desc    Get Gate Visits & Turnaround Report
// @route   GET /api/v1/reports/gate-visits
// @access  Private
const getGateVisitsReport = async (req, res, next) => {
  try {
    const report = await reportService.getGateVisitsReport(req.query);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Yard Utilization Report
// @route   GET /api/v1/reports/yard-utilization
// @access  Private
const getYardUtilizationReport = async (req, res, next) => {
  try {
    const report = await reportService.getYardUtilizationReport();
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Dock Utilization Report
// @route   GET /api/v1/reports/dock-utilization
// @access  Private
const getDockUtilizationReport = async (req, res, next) => {
  try {
    const report = await reportService.getDockUtilizationReport(req.query);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Shipments Summary Report
// @route   GET /api/v1/reports/shipments
// @access  Private
const getShipmentsReport = async (req, res, next) => {
  try {
    const report = await reportService.getShipmentsReport(req.query);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Driver Activity Report
// @route   GET /api/v1/reports/driver-activity
// @access  Private
const getDriverActivityReport = async (req, res, next) => {
  try {
    const report = await reportService.getDriverActivityReport();
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Report as CSV with formula injection protection
// @route   GET /api/v1/reports/export
// @access  Private
const exportReportCsv = async (req, res, next) => {
  try {
    const { type = 'gate-visits' } = req.query;
    const csvContent = await reportService.exportReportCsv(type, req.query);

    const filename = `yms_${type}_report_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGateVisitsReport,
  getYardUtilizationReport,
  getDockUtilizationReport,
  getShipmentsReport,
  getDriverActivityReport,
  exportReportCsv,
};
