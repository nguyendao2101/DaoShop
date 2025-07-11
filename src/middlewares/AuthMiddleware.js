// src/middlewares/authMiddleware.js - SAFE CONFIG LOADING
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authenticateToken = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // 🔍 DEBUG: Log thông tin
        console.log('🔍 Auth Debug Info:');
        console.log('  - Auth Header:', authHeader);
        console.log('  - Extracted Token:', token ? token.substring(0, 20) + '...' : 'NULL');

        // ✅ Safe environment loading
        let jwtSecret;
        try {
            const environment = require('../config/env');
            jwtSecret = environment.jwt?.secret;
            console.log('  - JWT Secret from config:', jwtSecret ? 'EXISTS' : 'NOT FOUND');
        } catch (configError) {
            console.log('  - Config load error:', configError.message);
            // Fallback to direct environment variable
            jwtSecret = process.env.JWT_SECRET;
            console.log('  - JWT Secret from direct env:', jwtSecret ? 'EXISTS' : 'NOT FOUND');
        }

        // Additional fallbacks
        if (!jwtSecret) {
            jwtSecret = process.env.ACCESS_TOKEN_SECRET; // Legacy fallback
            console.log('  - JWT Secret from ACCESS_TOKEN_SECRET:', jwtSecret ? 'EXISTS' : 'NOT FOUND');
        }

        // Kiểm tra xem token có tồn tại không
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Kiểm tra secret
        if (!jwtSecret) {
            console.log('❌ JWT secret not found in any configuration');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error - JWT secret missing',
                hint: 'Check .env file for JWT_SECRET'
            });
        }

        // 🔍 DEBUG: Decode token without verification first
        try {
            const decoded_without_verify = jwt.decode(token);
            console.log('📄 Token Payload (unverified):', {
                userId: decoded_without_verify?.userId,
                userName: decoded_without_verify?.userName,
                exp: decoded_without_verify?.exp,
                expDate: new Date(decoded_without_verify?.exp * 1000),
                isExpired: Date.now() > decoded_without_verify?.exp * 1000
            });
        } catch (decodeError) {
            console.log('❌ Token decode error:', decodeError.message);
        }

        // ✅ Giải mã token với secret
        const decoded = jwt.verify(token, jwtSecret);
        console.log('✅ Token verified successfully:', {
            userId: decoded.userId,
            userName: decoded.userName
        });

        // Tìm người dùng trong cơ sở dữ liệu dựa trên userId trong token
        const user = await User.findById(decoded.userId);
        console.log('👤 User lookup result:', user ? `Found: ${user.userName}` : 'Not found');

        // Kiểm tra xem người dùng có tồn tại và có trạng thái hoạt động không
        if (!user || !user.isActive) {
            console.log('❌ User not found or inactive');
            return res.status(401).json({
                success: false,
                message: 'Invalid token or user not found'
            });
        }

        // Gán thông tin người dùng vào req
        req.user = {
            id: user._id,
            userId: user._id,
            userName: user.userName,
            email: user.email,
            fullName: user.fullName,
            isActive: user.isActive
        };

        console.log('✅ Authentication successful for:', user.userName);
        next();

    } catch (error) {
        console.error('❌ Auth middleware error:', {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired',
                expired: true
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: 'Invalid token',
                detail: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { authenticateToken };