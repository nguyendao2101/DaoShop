// src/middlewares/requestLogger.js
const morgan = require('morgan');
const logger = require('../config/logger');
const env = require('../config/env');

// Tạo format cho morgan
morgan.token('body', (req) => {
    // Không log thông tin nhạy cảm
    const body = { ...req.body };
    if (body.password) body.password = '[REDACTED]';
    if (body.refreshToken) body.refreshToken = '[REDACTED]';
    return JSON.stringify(body);
});

morgan.token('user-id', (req) => {
    return req.user ? req.user._id : 'guest';
});

// Format cho development
const developmentFormat = ':method :url :status :response-time ms - :body - User: :user-id';

// Format cho production (không có body)
const productionFormat = ':remote-addr :method :url :status :response-time ms - User: :user-id';

// Middleware logger
const requestLogger = morgan(
    env.env === 'production' ? productionFormat : developmentFormat,
    { stream: logger.stream }
);

module.exports = requestLogger;