// src/controllers/UserController.js
const { validationResult } = require('express-validator');
const AuthService = require('../services/AuthService');
const GoogleOAuthService = require('../services/GoogleOAuthService');
const UserService = require('../services/UserService');
const EmailService = require('../services/EmailService');
const User = require('../models/UserModel');
const env = require('../config/env');
const logger = require('../config/logger');

class UserController {
    // Verify OTP
    async verifyOTP(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { email, otp } = req.body;

            // Verify OTP
            const user = await AuthService.verifyUserOTP(email, otp);

            // Send welcome email
            await EmailService.sendWelcomeEmail(email, user.userName);

            // Generate tokens
            const { accessToken, refreshToken } = await AuthService.generateUserTokens(user);

            // ✅ FIX: Set cookie directly instead of using this.setRefreshTokenCookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: env.env === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                success: true,
                message: 'Email verified successfully! Welcome to DaoShop!',
                data: {
                    user: {
                        id: user._id,
                        userName: user.userName,
                        email: user.email,
                        isEmailVerified: user.isEmailVerified
                    },
                    accessToken
                }
            });

        } catch (error) {
            logger.error('Verify OTP error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // Register
    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { userName, password, email } = req.body;

            // Check if user exists
            const existingUser = await AuthService.checkUserExists(userName, email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Username or email already exists'
                });
            }

            // Create user
            const { user, otp } = await AuthService.createUser({ userName, password, email });

            // Send OTP email
            const emailResult = await EmailService.sendOTPEmail(email, otp, userName);
            if (!emailResult.success) {
                await User.findByIdAndDelete(user._id);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send verification email. Please try again.'
                });
            }

            res.status(201).json({
                success: true,
                message: 'Registration successful! Please check your email for OTP verification.',
                data: {
                    email: email,
                    expiresIn: '10 minutes'
                }
            });

        } catch (error) {
            logger.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Resend OTP
    async resendOTP(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { email } = req.body;

            // Resend OTP
            const { user, otp } = await AuthService.resendOTP(email);

            // Send OTP email
            const emailResult = await EmailService.sendOTPEmail(email, otp, user.userName);
            if (!emailResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send OTP email. Please try again.'
                });
            }

            res.json({
                success: true,
                message: 'OTP has been resent to your email.',
                data: {
                    email: email,
                    expiresIn: '10 minutes'
                }
            });

        } catch (error) {
            logger.error('Resend OTP error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // Login
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { identifier, userName, password } = req.body;
            const loginIdentifier = identifier || userName;

            if (!loginIdentifier || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email/Username and password are required'
                });
            }

            // Login user
            const user = await AuthService.loginUser(loginIdentifier, password);

            // Generate tokens
            const { accessToken, refreshToken } = await AuthService.generateUserTokens(user);

            // Set cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: env.env === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user._id,
                        userName: user.userName,
                        email: user.email,
                        fullName: user.fullName,
                        avatar: user.avatar,
                        isEmailVerified: user.isEmailVerified
                    },
                    accessToken
                }
            });

        } catch (error) {
            logger.error('Login error:', error);

            let statusCode = 500;
            let message = 'Internal server error';

            if (error.message === 'GOOGLE_USER') {
                statusCode = 401;
                message = 'This account was created with Google. Please use Google Sign-In.';
            } else if (error.message === 'EMAIL_NOT_VERIFIED') {
                statusCode = 401;
                message = 'Please verify your email before logging in';
            } else if (error.message.includes('Invalid credentials')) {
                statusCode = 401;
                message = 'Invalid credentials';
            }

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    // Google OAuth Callback
    async googleCallback(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.redirect(`${env.frontend.url}/login?error=oauth_failed`);
            }

            // Generate OAuth response
            const { accessToken, refreshToken, redirectUrl } = await GoogleOAuthService.generateOAuthResponse(user);

            // Set cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: env.env === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.redirect(redirectUrl);

        } catch (error) {
            logger.error('Google callback error:', error);
            res.redirect(`${env.frontend.url}/login?error=server_error`);
        }
    }

    // Refresh Token
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }

            // Refresh token
            const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshUserToken(refreshToken);

            // Set new cookie
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: env.env === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: { accessToken }
            });

        } catch (error) {
            logger.error('Refresh token error:', error);
            res.status(403).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    // Logout
    async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;

            await AuthService.logoutUser(refreshToken);
            res.clearCookie('refreshToken');

            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get Profile
    async getProfile(req, res) {
        try {
            const userProfile = await UserService.getUserProfile(req.user._id);

            res.json({
                success: true,
                data: { user: userProfile }
            });

        } catch (error) {
            logger.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // ✅ Utility method (optional - cho clean code)
    setRefreshTokenCookie(res, refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env.env === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    }
}

module.exports = new UserController();