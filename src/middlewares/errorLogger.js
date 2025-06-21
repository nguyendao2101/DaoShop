// src/middlewares/errorLogger.js
const logger = require('../config/logger');
const env = require('../config/env');

const errorLogger = (err, req, res, next) => {
    // Log error
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // Thêm stack trace trong development
    if (env.env === 'development') {
        logger.debug(err.stack);
    }

    // Chuyển đến error handler tiếp theo
    next(err);
};

const errorHandler = (err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: env.env === 'development' ? err.stack : undefined
    });
};

module.exports = { errorLogger, errorHandler };