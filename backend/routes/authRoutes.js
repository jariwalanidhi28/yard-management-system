const express = require('express');
const router = express.Router();
const { login, logout, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { loginRules, changePasswordRules } = require('../validators/authValidator');

router.post('/login', authLimiter, loginRules, validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePasswordRules, validate, changePassword);

module.exports = router;
