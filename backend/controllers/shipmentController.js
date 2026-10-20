const shipmentService = require('../services/shipmentService');

// @desc    Get all shipments (paginated, filtered, search)
// @route   GET /api/v1/shipments
// @access  Private
const getShipments = async (req, res, next) => {
  try {
    const result = await shipmentService.getShipments(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single shipment by ID
// @route   GET /api/v1/shipments/:id
// @access  Private
const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await shipmentService.getShipmentById(req.params.id);
    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new shipment
// @route   POST /api/v1/shipments
// @access  Private
const createShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.createShipment(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: `Shipment created with Tracking #${shipment.trackingNumber}.`,
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add tracking event / update status
// @route   POST /api/v1/shipments/:id/events
// @access  Private
const addShipmentEvent = async (req, res, next) => {
  try {
    const event = await shipmentService.addEvent(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: `Shipment status updated to '${event.status}'.`,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tracking events for a shipment
// @route   GET /api/v1/shipments/:id/events
// @access  Private
const getShipmentEvents = async (req, res, next) => {
  try {
    const events = await shipmentService.getShipmentEvents(req.params.id);
    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public tracking endpoint (Restricted fields)
// @route   GET /api/v1/shipments/track/:trackingNumber
// @access  Public
const getPublicTracking = async (req, res, next) => {
  try {
    const trackingData = await shipmentService.getPublicTracking(req.params.trackingNumber);
    res.status(200).json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShipments,
  getShipmentById,
  createShipment,
  addShipmentEvent,
  getShipmentEvents,
  getPublicTracking,
};
