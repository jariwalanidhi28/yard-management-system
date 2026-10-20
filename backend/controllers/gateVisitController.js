const gateVisitService = require('../services/gateVisitService');

// @desc    Get all gate visits (paginated, filtered, search)
// @route   GET /api/v1/gate-visits
// @access  Private
const getGateVisits = async (req, res, next) => {
  try {
    const result = await gateVisitService.getGateVisits(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single gate visit details
// @route   GET /api/v1/gate-visits/:id
// @access  Private
const getGateVisitById = async (req, res, next) => {
  try {
    const visit = await gateVisitService.getGateVisitById(req.params.id);
    res.status(200).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register vehicle entry (Gate Check-In)
// @route   POST /api/v1/gate-visits
// @access  Private
const createGateEntry = async (req, res, next) => {
  try {
    const visit = await gateVisitService.createGateEntry(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: `Gate entry recorded. Gate pass ${visit.gatePassNumber} issued.`,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record vehicle exit (Gate Check-Out)
// @route   POST /api/v1/gate-visits/:id/exit
// @access  Private
const recordExit = async (req, res, next) => {
  try {
    const { exitNotes } = req.body;
    const visit = await gateVisitService.recordExit(req.params.id, req.user._id, exitNotes);
    res.status(200).json({
      success: true,
      message: `Gate exit recorded successfully for pass ${visit.gatePassNumber}.`,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGateVisits,
  getGateVisitById,
  createGateEntry,
  recordExit,
};
