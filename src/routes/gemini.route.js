const express = require('express');
const GeminiController = require('../controllers/gemini.controller');
const router = express.Router();

router.post('/ask', GeminiController.askGemini);

module.exports = router;