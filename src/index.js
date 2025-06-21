// src/index.js
require('dotenv').config();
const prettify = require('express-prettify');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { globalLimiter } = require('./config/rateLimiter');

const app = express();
const PORT = process.env.PORT || 8797;

// Database
const db = require('./config/db');

// CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Thêm vào sau các middleware cơ bản
app.use(express.json());
app.use(cookieParser());
// Thêm prettify middleware
app.use(prettify({ query: 'pretty' }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'daoshop-secret',
    resave: false,
    saveUninitialized: false
}));

// Passport
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// ✅ Swagger setup
try {
    const { specs, swaggerUi } = require('./config/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    console.log('✅ Swagger configured successfully');
} catch (error) {
    console.log('⚠️ Swagger configuration failed:', error.message);
}

// Routes
const route = require('./routes');
route(app);

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
    console.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
db.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server: http://localhost:${PORT}`);
            console.log(`📚 Docs: http://localhost:${PORT}/api-docs`);
            console.log(`🔍 Test: http://localhost:${PORT}/test-google`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to start:', err);
        process.exit(1);
    });