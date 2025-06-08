const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8797;
const db = require('./config/db');

// Connect to database
db.connect();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const route = require('./routes');
route(app);

app.listen(PORT, () => {
    console.log('Server started on http://localhost:' + PORT);
});

module.exports = app;