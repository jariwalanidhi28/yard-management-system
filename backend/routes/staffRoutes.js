const express = require('express');
const router = express.Router();
const {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { createStaffRules, updateStaffRules } = require('../validators/authValidator');
const { ROLES } = require('../config/constants');

// All staff routes require Admin role
router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.route('/')
  .get(getStaff)
  .post(createStaffRules, validate, createStaff);

router.route('/:id')
  .get(getStaffById)
  .patch(updateStaffRules, validate, updateStaff)
  .delete(deleteStaff);

module.exports = router;
