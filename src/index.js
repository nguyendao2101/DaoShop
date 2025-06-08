const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8797;
const db = require('./config/db');

db.connect();

app.use('/', (req, res) => {
    res.json({ 'mess': 'Hello World!' });
});

app.listen(PORT, () => {
    console.log('Server started on http://localhost:' + PORT);
});

module.exports = app;