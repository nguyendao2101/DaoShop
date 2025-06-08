// src/index.js
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const session = require('express-session');

// ✅ Load environment variables TRƯỚC khi import passport
dotenv.config();

const passport = require('./config/passport'); // Import sau khi dotenv.config()

const app = express();
const PORT = process.env.PORT || 8797;

// Database
const db = require('./config/db');
db.connect();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session
app.use(session({
    secret: process.env.ACCESS_TOKEN_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
const route = require('./routes');
route(app);

app.listen(PORT, () => {
    console.log('🚀 Server started on http://localhost:' + PORT);
});

module.exports = app;