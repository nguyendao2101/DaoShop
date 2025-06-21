// src/index.js
const env = require('./config/env');
const prettify = require('express-prettify');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('./config/logger');
const requestLogger = require('./middlewares/requestLogger');
const { errorLogger, errorHandler } = require('./middlewares/errorLogger');
const { globalLimiter } = require('./config/rateLimiter');

const app = express();
const PORT = env.PORT || 8797;;

// Database
const db = require('./config/db');

// CORS
app.use(cors({
    origin: [env.frontend.url],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Thêm vào sau các middleware cơ bản
app.use(express.json());
app.use(prettify({ query: 'pretty' }));

app.use(requestLogger);


// Session
app.use(session({
    secret: env.session.secret || 'daoshop-secret',
    resave: false,
    saveUninitialized: false
}));

// Passport
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// ✅ Swagger setup
try {
    const { specs, swaggerUi } = require('./docs/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    logger.info('✅ Swagger configured successfully');
} catch (error) {
    logger.info('⚠️ Swagger configuration failed:', error.message);
}

// Routes
const route = require('./routes');
route(app);
// Error logger - đặt sau tất cả các routes
app.use(errorLogger);
app.use(errorHandler);

// Test route
app.get('/test-google', (req, res) => {
    res.send(`
        <h1>DaoShop API Test</h1>
        <p><a href="/api-docs">📚 API Documentation</a></p>
        <p><a href="/api/auth/google">🔐 Google Login</a></p>
    `);
});
app.use('/api', globalLimiter);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        availableRoutes: {
            docs: '/api-docs',
            auth: '/api/auth/*',
            test: '/test-google'
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
db.connect()
    .then(() => {
        app.listen(PORT, () => {
            logger.info(`🚀 Server: http://localhost:${PORT}`);
            logger.info(`📚 Docs: http://localhost:${PORT}/api-docs`);
            logger.info(`🔍 Test: http://localhost:${PORT}/test-google`);
        });
    })
    .catch(err => {
        logger.error('❌ Failed to start:', err);
        process.exit(1);
    });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', { error: err.stack });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION', { reason, promise });
    process.exit(1);
});