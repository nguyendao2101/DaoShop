const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middlewares/AuthMiddleware');
const {
    registerValidation,
    loginValidation,
    verifyOTPValidation,
    resendOTPValidation
} = require('../validations/AuthValidation');

// Debug log để kiểm tra UserController
console.log('UserController methods:', Object.getOwnPropertyNames(UserController));

// Đăng ký (gửi OTP)
router.post('/register', registerValidation, UserController.register);

// Verify OTP
router.post('/verify-otp', verifyOTPValidation, UserController.verifyOTP);

// Gửi lại OTP
router.post('/resend-otp', resendOTPValidation, UserController.resendOTP);

// Đăng nhập (chỉ cho user đã verify)
router.post('/login', loginValidation, UserController.login);

// Refresh token
router.post('/refresh-token', UserController.refreshToken);

// Đăng xuất
router.post('/logout', UserController.logout);

// Lấy profile (cần token)
router.get('/profile', authenticateToken, UserController.getProfile);

module.exports = router;