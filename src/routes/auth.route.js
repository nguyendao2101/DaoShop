// src/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
    authLimiter,
    registerLimiter,
    otpLimiter
} = require('../config/rateLimiter');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Register with rate limiting (3 registrations per hour)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 example: johndoe123
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many registration attempts
 */
router.post('/register', registerLimiter, UserController.register);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Authentication]
 *     description: Verify OTP sent to user's email with rate limiting (5 attempts per hour)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp', otpLimiter, UserController.verifyOTP);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Gửi lại OTP
 *     description: Resend OTP to user's email with rate limiting (3 requests per hour)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP đã được gửi lại
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/resend-otp', otpLimiter, UserController.resendOTP);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     description: Login with rate limiting (5 login attempts per hour)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyendao21012002@gmail.com
 *                 description: Email đăng nhập
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *                 description: Mật khẩu
 *               userName:
 *                 type: string
 *                 example: nguyendao2101
 *                 description: Tên đăng nhập (thay thế cho email)
 *             required:
 *               - password
 *           examples:
 *             loginWithEmail:
 *               summary: Đăng nhập bằng email
 *               value:
 *                 email: "nguyendao21012002@gmail.com"
 *                 password: "123456"
 *             loginWithUserName:
 *               summary: Đăng nhập bằng username
 *               value:
 *                 userName: "nguyendao2101"
 *                 password: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đăng nhập thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: JWT refresh token
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "6870c70c1ca5164be10bb91d"
 *                         userName:
 *                           type: string
 *                           example: "nguyendao2101"
 *                         email:
 *                           type: string
 *                           example: "nguyendao21012002@gmail.com"
 *                         fullName:
 *                           type: string
 *                           example: "Nguyen Dao"
 *                         isEmailVerified:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Invalid credentials or validation error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: "Email/tên đăng nhập hoặc mật khẩu không chính xác"
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: "Vui lòng xác minh email trước khi đăng nhập"
 *                     needVerification:
 *                       type: boolean
 *                       example: true
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authLimiter, UserController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile', authenticateToken, UserController.getProfile);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post('/refresh-token', UserController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', UserController.logout);

// Google OAuth routes (simple)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), UserController.googleCallback);
router.put('/profile', authenticateToken, [
    body('fullName').optional().isLength({ max: 100 }).trim(),
    body('phone').optional().custom(value => {
        if (value === '') return true; // Allow empty string
        return /^[0-9]{10,11}$/.test(value);
    }).withMessage('Phone must be 10-11 digits or empty'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    body('gender').optional().isIn(['male', 'female', 'other', '']).withMessage('Invalid gender'),
    body('address.street').optional().isLength({ max: 200 }).trim(),
    body('address.ward').optional().isLength({ max: 100 }).trim(),
    body('address.district').optional().isLength({ max: 100 }).trim(),
    body('address.city').optional().isLength({ max: 100 }).trim(),
    body('address.zipCode').optional().isLength({ max: 10 }).trim(),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL')
], UserController.updateProfile);

router.put('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required')
], UserController.changePassword);

module.exports = router;