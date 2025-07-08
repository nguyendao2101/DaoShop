// src/index.js
const env = require('./config/env');
const prettify = require('express-prettify');
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('./config/logger');
const requestLogger = require('./middlewares/requestLogger');
const { errorLogger, errorHandler } = require('./middlewares/errorLogger');
const { globalLimiter } = require('./config/rateLimiter');
const CommentSocketServer = require('./websocket/commentSocket');
const CommentController = require('./controllers/comment.controller');

const app = express();
const PORT = env.PORT || 8797;

// Database
const db = require('./config/db');

// CORS - Cập nhật để hỗ trợ WebSocket
app.use(cors({
    origin: [env.frontend.url, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(prettify({ query: 'pretty' }));
app.use(requestLogger);

// Rate limiting - đặt trước routes
app.use('/api', globalLimiter);

// Session
app.use(session({
    secret: env.session.secret || 'daoshop-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Swagger setup
try {
    const { specs, swaggerUi } = require('./docs/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'DaoShop API Documentation'
    }));
    logger.info('✅ Swagger configured successfully');
} catch (error) {
    logger.warn('⚠️ Swagger configuration failed:', error.message);
}

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);

// Setup WebSocket Server
let commentSocketServer;
try {
    commentSocketServer = new CommentSocketServer(server);

    // Inject WebSocket into CommentController
    CommentController.setWebSocket(commentSocketServer);

    logger.info('✅ WebSocket server configured successfully');
} catch (error) {
    logger.error('❌ WebSocket configuration failed:', error.message);
}

// Health check endpoints
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: env.NODE_ENV
    });
});

// WebSocket health check
app.get('/api/websocket/health', (req, res) => {
    const isWebSocketRunning = commentSocketServer ? true : false;

    res.json({
        success: isWebSocketRunning,
        message: isWebSocketRunning ? 'WebSocket server is running' : 'WebSocket server is not available',
        timestamp: new Date().toISOString(),
        websocket: {
            enabled: isWebSocketRunning,
            endpoint: `ws://localhost:${PORT}`
        }
    });
});

// Routes - đặt sau WebSocket setup
const route = require('./routes');
route(app);

// Error handling middleware - đặt sau tất cả routes
app.use(errorLogger);
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        availableRoutes: {
            docs: '/api-docs',
            health: '/health',
            websocket_health: '/api/websocket/health',
            auth: '/api/auth/*',
            comments: '/api/comments/*',
            test: '/test-google'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('❌ Global Error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    res.status(err.status || 500).json({
        success: false,
        message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server with database and WebSocket
async function startServer() {
    try {
        // Connect to database
        await db.connect();
        logger.info('✅ Database connected successfully');

        // Start server with WebSocket support
        server.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📡 HTTP: http://localhost:${PORT}`);
            logger.info(`📖 Docs: http://localhost:${PORT}/api-docs`);
            logger.info(`🧪 Test: http://localhost:${PORT}/test-google`);
            logger.info(`💓 Health: http://localhost:${PORT}/health`);

            if (commentSocketServer) {
                logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
                logger.info(`💬 WebSocket Health: http://localhost:${PORT}/api/websocket/health`);
            }

            logger.info(`🌍 Environment: ${env.NODE_ENV}`);
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully');

    server.close(() => {
        logger.info('✅ HTTP server closed');

        // Close database connection
        db.disconnect().then(() => {
            logger.info('✅ Database disconnected');
            process.exit(0);
        }).catch((err) => {
            logger.error('❌ Error disconnecting database:', err);
            process.exit(1);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('🛑 SIGINT received, shutting down gracefully');

    server.close(() => {
        logger.info('✅ HTTP server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('💥 UNCAUGHT EXCEPTION - Shutting down...', {
        error: err.message,
        stack: err.stack
    });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 UNHANDLED REJECTION - Shutting down...', {
        reason: reason,
        promise: promise
    });
    process.exit(1);
});

// Start the server
startServer();

// Export for testing
module.exports = { app, server, commentSocketServer };