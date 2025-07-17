const axios = require('axios');
const env = require('../config/env');

const GEMINI_API_URL = env.genmini.apiUrl;
const GEMINI_API_KEY = env.genmini.apiKey;

class GeminiService {
    static async chat(prompt) {
        try {
            const response = await axios.post(
                `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
                {
                    contents: [{ parts: [{ text: prompt }] }]
                }
            );
            // Trả về nội dung trả lời
            return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
            console.error('Gemini API error:', error.response?.data || error.message);
            throw new Error('Gemini API error');
        }
    }
}

module.exports = GeminiService;