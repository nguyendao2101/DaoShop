// src/config/logger.js
const winston = require('winston');
const { format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;
require('winston-daily-rotate-file');
const env = require('./env');

// Định nghĩa màu cho các level log
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Thêm màu vào winston
winston.addColors(colors);

// Format cho console (đẹp và có màu)
const consoleFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(({ timestamp, level, message, ...metadata }) => {
        const metaStr = Object.keys(metadata).length
            ? JSON.stringify(metadata, null, 2)
            : '';
        return `[${timestamp}] ${level}: ${message} ${metaStr}`;
    })
);

// Format cho file (JSON với timestamp)
const fileFormat = combine(
    timestamp(),
    json()
);

// Tạo transport cho file logs
const fileRotateTransport = new transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat
});

// Tạo transport cho error logs
const errorRotateTransport = new transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: fileFormat
});

// Tạo logger
const logger = winston.createLogger({
    level: env.env === 'production' ? 'info' : 'debug',
    format: fileFormat,
    transports: [
        // Console transport
        new transports.Console({
            format: consoleFormat
        }),
        // File transports
        fileRotateTransport,
        errorRotateTransport
    ],
    // Không dừng ứng dụng khi gặp lỗi logging
    exitOnError: false
});

// Stream cho morgan
logger.stream = {
    write: (message) => logger.http(message.trim()),
};

module.exports = logger;