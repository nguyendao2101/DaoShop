// src/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 8797;

// Database
const db = require('./config/db');

// CORS configuration
const corsOptions = {
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'daoshop-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ✅ Initialize Passport AFTER session middleware
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Routes
const route = require('./routes');
route(app);

// Test Google OAuth route
app.get('/test-google', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Google OAuth - DaoShop</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 50px; text-align: center; }
                .button { display: inline-block; padding: 15px 30px; background: #4285f4; 
                         color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
                .info { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>🔍 Test Google OAuth - DaoShop</h1>
            <div class="info">
                <p><strong>Base URL:</strong> http://localhost:8797</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            </div>
            <a href="/api/auth/google" class="button">🔐 Login with Google</a>
        </body>
        </html>
    `);
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        availableEndpoints: {
            'Test Google OAuth': '/test-google',
            'Health Check': '/',
            'Auth APIs': '/api/auth/*'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

// Start server
db.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server started on http://localhost:${PORT}`);
            console.log(`🔍 Test Google OAuth: http://localhost:${PORT}/test-google`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    });