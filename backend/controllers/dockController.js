const dockService = require('../services/dockService');

// Docks
const getDocks = async (req, res, next) => {
  try {
    const docks = await dockService.getDocks();
    res.status(200).json({ success: true, count: docks.length, data: docks });
  } catch (error) {
    next(error);
  }
};

const getDockById = async (req, res, next) => {
  try {
    const dock = await dockService.getDockById(req.params.id);
    res.status(200).json({ success: true, data: dock });
  } catch (error) {
    next(error);
  }
};

const createDock = async (req, res, next) => {
  try {
    const dock = await dockService.createDock(req.body);
    res.status(201).json({ success: true, message: 'Dock created successfully.', data: dock });
  } catch (error) {
    next(error);
  }
};

const updateDock = async (req, res, next) => {
  try {
    const dock = await dockService.updateDock(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Dock updated successfully.', data: dock });
  } catch (error) {
    next(error);
  }
};

const deleteDock = async (req, res, next) => {
  try {
    const result = await dockService.deleteDock(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Appointments
const getAppointments = async (req, res, next) => {
  try {
    const appointments = await dockService.getAppointments(req.query);
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const appt = await dockService.getAppointmentById(req.params.id);
    res.status(200).json({ success: true, data: appt });
  } catch (error) {
    next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const appt = await dockService.createAppointment(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Dock appointment scheduled successfully.',
      data: appt,
    });
  } catch (error) {
    next(error);
  }
};

const startAppointment = async (req, res, next) => {
  try {
    const appt = await dockService.startAppointment(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Dock operation commenced (In Progress).',
      data: appt,
    });
  } catch (error) {
    next(error);
  }
};

const completeAppointment = async (req, res, next) => {
  try {
    const appt = await dockService.completeAppointment(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Dock operation completed.',
      data: appt,
    });
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const appt = await dockService.cancelAppointment(req.params.id, req.user._id, reason);
    res.status(200).json({
      success: true,
      message: 'Dock appointment cancelled.',
      data: appt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDocks,
  getDockById,
  createDock,
  updateDock,
  deleteDock,
  getAppointments,
  getAppointmentById,
  createAppointment,
  startAppointment,
  completeAppointment,
  cancelAppointment,
};
