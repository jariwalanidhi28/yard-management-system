const express = require('express');
const router = express.Router();
const {
  getGateVisitsReport,
  getYardUtilizationReport,
  getDockUtilizationReport,
  getShipmentsReport,
  getDriverActivityReport,
  exportReportCsv,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/gate-visits', getGateVisitsReport);
router.get('/yard-utilization', getYardUtilizationReport);
router.get('/dock-utilization', getDockUtilizationReport);
router.get('/shipments', getShipmentsReport);
router.get('/driver-activity', getDriverActivityReport);
router.get('/export', exportReportCsv);

module.exports = router;
