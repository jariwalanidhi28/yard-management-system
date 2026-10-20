const yardService = require('../services/yardService');

// Zones
const getZones = async (req, res, next) => {
  try {
    const zones = await yardService.getZones();
    res.status(200).json({ success: true, count: zones.length, data: zones });
  } catch (error) {
    next(error);
  }
};

const getZoneById = async (req, res, next) => {
  try {
    const zone = await yardService.getZoneById(req.params.id);
    res.status(200).json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

const createZone = async (req, res, next) => {
  try {
    const zone = await yardService.createZone(req.body);
    res.status(201).json({ success: true, message: 'Yard zone created.', data: zone });
  } catch (error) {
    next(error);
  }
};

const updateZone = async (req, res, next) => {
  try {
    const zone = await yardService.updateZone(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Yard zone updated.', data: zone });
  } catch (error) {
    next(error);
  }
};

const deleteZone = async (req, res, next) => {
  try {
    const result = await yardService.deleteZone(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Slots
const getSlots = async (req, res, next) => {
  try {
    const slots = await yardService.getSlots(req.query);
    res.status(200).json({ success: true, count: slots.length, data: slots });
  } catch (error) {
    next(error);
  }
};

const createSlot = async (req, res, next) => {
  try {
    const slot = await yardService.createSlot(req.body);
    res.status(201).json({ success: true, message: 'Yard slot created.', data: slot });
  } catch (error) {
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const slot = await yardService.updateSlot(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Yard slot updated.', data: slot });
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const result = await yardService.deleteSlot(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Visual Map
const getYardMap = async (req, res, next) => {
  try {
    const map = await yardService.getYardMap();
    res.status(200).json({ success: true, data: map });
  } catch (error) {
    next(error);
  }
};

// Allocate Slot
const allocateSlot = async (req, res, next) => {
  try {
    const { visitId } = req.body;
    const slot = await yardService.allocateSlot(req.params.id, visitId, req.user._id);
    res.status(200).json({ success: true, message: 'Slot allocated successfully.', data: slot });
  } catch (error) {
    next(error);
  }
};

// Release Slot
const releaseSlot = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const slot = await yardService.releaseSlot(req.params.id, req.user._id, reason);
    res.status(200).json({ success: true, message: 'Slot released successfully.', data: slot });
  } catch (error) {
    next(error);
  }
};

// Reassign Slot for a Gate Visit
const reassignSlot = async (req, res, next) => {
  try {
    const { newSlotId, reason } = req.body;
    const slot = await yardService.reassignSlot(req.params.id, newSlotId, req.user._id, reason);
    res.status(200).json({ success: true, message: 'Slot reassigned successfully.', data: slot });
  } catch (error) {
    next(error);
  }
};

// Movements Audit Trail
const getMovements = async (req, res, next) => {
  try {
    const result = await yardService.getMovements(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getYardMap,
  allocateSlot,
  releaseSlot,
  reassignSlot,
  getMovements,
};
