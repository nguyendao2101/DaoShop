// src/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const UserController = require('../controllers/UserController');

// ✅ Import validation
const { authValidation } = require('../validations/AuthValidation');
const { handleValidationErrors } = require('../middlewares/errorHandler');

// ✅ Basic routes without complex Swagger annotations first
router.post('/register',
    authValidation.register,
    handleValidationErrors,
    UserController.register
);

router.post('/verify-otp',
    authValidation.verifyOTP,
    handleValidationErrors,
    UserController.verifyOTP
);

router.post('/resend-otp',
    authValidation.resendOTP,
    handleValidationErrors,
    UserController.resendOTP
);

router.post('/login',
    authValidation.login,
    handleValidationErrors,
    UserController.login
);

router.get('/profile',
    passport.authenticate('jwt', { session: false }),
    UserController.getProfile
);

router.post('/refresh-token', UserController.refreshToken);

router.post('/logout', UserController.logout);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
    UserController.googleCallback
);

module.exports = router;