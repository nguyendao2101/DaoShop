const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const EmailService = require('../services/EmailService');

class UserController {
    // Đăng ký - Gửi OTP
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

            // Kiểm tra user đã tồn tại
            const existingUser = await User.findOne({
                $or: [{ userName }, { email }]
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Username or email already exists'
                });
            }

            // Tạo user mới (chưa verify email)
            const user = new User({
                userName,
                password,
                email,
                isEmailVerified: false
            });

            // Tạo OTP
            const otp = user.generateOTP();
            await user.save();

            // Gửi OTP qua email
            const emailResult = await EmailService.sendOTPEmail(email, otp, userName);

            if (!emailResult.success) {
                // Nếu gửi email thất bại, xóa user vừa tạo
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
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

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

            // Tìm user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Kiểm tra đã verify chưa
            if (user.isEmailVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already verified'
                });
            }

            // Verify OTP
            if (!user.verifyOTP(otp)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired OTP'
                });
            }

            // Cập nhật trạng thái verified
            user.isEmailVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();

            // Gửi email chào mừng
            await EmailService.sendWelcomeEmail(email, user.userName);

            // Tạo tokens
            const { accessToken, refreshToken } = user.generateTokens();
            user.refreshToken = refreshToken;
            await user.save();

            // Set cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
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
            console.error('Verify OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Gửi lại OTP
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

            // Tìm user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Kiểm tra đã verify chưa
            if (user.isEmailVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already verified'
                });
            }

            // Tạo OTP mới
            const otp = user.generateOTP();
            await user.save();

            // Gửi OTP qua email
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
            console.error('Resend OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Đăng nhập
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

            const { userName, password } = req.body;

            // Tìm user
            const user = await User.findOne({ userName });
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Kiểm tra email đã được verify chưa
            if (!user.isEmailVerified) {
                return res.status(401).json({
                    success: false,
                    message: 'Please verify your email before logging in',
                    data: {
                        email: user.email,
                        needVerification: true
                    }
                });
            }

            // Kiểm tra password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Tạo tokens
            const { accessToken, refreshToken } = user.generateTokens();
            user.refreshToken = refreshToken;
            await user.save();

            // Set cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
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
                        isEmailVerified: user.isEmailVerified
                    },
                    accessToken
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Refresh token
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await User.findOne({
                _id: decoded.userId,
                refreshToken: refreshToken
            });

            if (!user || !user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }

            // Tạo tokens mới
            const { accessToken, refreshToken: newRefreshToken } = user.generateTokens();

            // Cập nhật refresh token
            user.refreshToken = newRefreshToken;
            await user.save();

            // Set cookie mới
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken
                }
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(403).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    // Đăng xuất
    async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (refreshToken) {
                // Xóa refresh token khỏi database
                await User.updateOne(
                    { refreshToken },
                    { $unset: { refreshToken: 1 } }
                );
            }

            // Xóa cookie
            res.clearCookie('refreshToken');

            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Lấy thông tin user hiện tại
    async getProfile(req, res) {
        try {
            const user = req.user;
            res.json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        userName: user.userName,
                        email: user.email,
                        createdAt: user.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new UserController();