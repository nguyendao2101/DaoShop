const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middlewares/AuthMiddleware');
const { registerValidation, loginValidation } = require('../validations/AuthValidation');

// Đăng ký
router.post('/register', registerValidation, UserController.register);

// Đăng nhập
router.post('/login', loginValidation, UserController.login);

// Refresh token
router.post('/refresh-token', UserController.refreshToken);

// Đăng xuất
router.post('/logout', UserController.logout);

// Lấy profile (cần token)
router.get('/profile', authenticateToken, UserController.getProfile);

module.exports = router;