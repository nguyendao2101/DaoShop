// src/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport'); // ✅ Thêm import này
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middlewares/AuthMiddleware');
const {
    registerValidation,
    loginValidation,
    verifyOTPValidation,
    resendOTPValidation
} = require('../validations/AuthValidation');

// Existing routes...
router.post('/register', registerValidation, UserController.register);
router.post('/verify-otp', verifyOTPValidation, UserController.verifyOTP);
router.post('/resend-otp', resendOTPValidation, UserController.resendOTP);
router.post('/login', loginValidation, UserController.login);
router.post('/refresh-token', UserController.refreshToken);
router.post('/logout', UserController.logout);
router.get('/profile', authenticateToken, UserController.getProfile);

// THÊM Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
        session: false
    }),
    UserController.googleCallback
);

module.exports = router;