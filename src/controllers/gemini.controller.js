const GeminiService = require('../services/gemini.service');

class GeminiController {
    static async askGemini(req, res) {
        try {
            const { prompt } = req.body;
            if (!prompt) return res.status(400).json({ message: 'Missing prompt' });
            const answer = await GeminiService.chat(prompt);
            res.json({ answer });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = GeminiController;