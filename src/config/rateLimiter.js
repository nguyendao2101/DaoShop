// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const env = require('./env');
/**
 * Tạo rate limiter với các cấu hình tùy chỉnh
 * @param {number} windowMs - Thời gian window (milliseconds)
 * @param {number} max - Số lượng request tối đa
 * @param {string} message - Thông báo khi vượt quá giới hạn
 * @returns {Function} Express middleware
 */
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: message || 'Too many requests, please try again later',
            retryAfter: Math.ceil(windowMs / 1000) // seconds
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        // Trả về true để bỏ qua rate limiting trong môi trường development
        skip: (req) => env.env === 'development' && env.rateLimiting.disabled
    });
};

// Global limiter - áp dụng cho toàn bộ API
const globalLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per 15 minutes
    'Too many requests from this IP, please try again after 15 minutes'
);

// Authentication limiter - giới hạn chặt chẽ hơn cho các endpoints auth
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    20, // 5 attempts per 15 minutes
    'Too many login attempts, please try again after 15 minutes'
);

// Registration limiter - ngăn đăng ký hàng loạt
const registerLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    6, // 3 registrations per hour
    'Too many registration attempts, please try again after 1 hour'
);

// OTP limiter - giới hạn gửi OTP
const otpLimiter = createRateLimiter(
    10 * 60 * 1000, // 10 minutes
    6, // 3 OTP requests per 10 minutes
    'Too many OTP requests, please try again after 10 minutes'
);

// API limiter - giới hạn nhẹ hơn cho các API khác
const apiLimiter = createRateLimiter(
    60 * 1000, // 1 minute
    30, // 30 requests per minute
    'Too many API requests, please try again after 1 minute'
);

module.exports = {
    globalLimiter,
    authLimiter,
    registerLimiter,
    otpLimiter,
    apiLimiter,
    createRateLimiter // Xuất hàm tạo để có thể custom thêm nếu cần
};