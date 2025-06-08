const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

class UserController {
    // Đăng ký
    async register(req, res) {
        try {
            // kiểm tra dữ liệu đầu vào
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            // Lấy dữ liệu từ request body gửi lên 
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

            // Tạo user mới, lưu vào MongoDB. Password nên được mã hóa tự động trong schema.
            const user = new User({ userName, password, email });
            await user.save();

            // Tạo tokens, Gọi hàm tạo token từ model
            const { accessToken, refreshToken } = user.generateTokens();

            // Lưu refresh token vào database
            user.refreshToken = refreshToken;
            await user.save();

            // Set cookie cho refresh token
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            // Trả về thông tin user và access token
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user._id,
                        userName: user.userName,
                        email: user.email
                    },
                    accessToken
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

    // Đăng nhập
    async login(req, res) {
        try {
            // Kiểm tra dữ liệu đầu vào
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

            // Lưu refresh token
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
                        email: user.email
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