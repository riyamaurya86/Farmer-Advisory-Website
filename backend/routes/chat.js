const express = require('express');
const axios = require('axios');

const router = express.Router();

// Middleware to validate Gemini API key
const validateGeminiKey = (req, res, next) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
            error: 'Gemini API key not configured',
            message: 'Please configure GEMINI_API_KEY in environment variables'
        });
    }
    next();
};

// POST /api/chat/message - Send message to Gemini AI
router.post('/message', validateGeminiKey, async (req, res) => {
    try {
        const { message, language = 'en', imageData = null } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Message is required'
            });
        }

        // Prepare the request payload for Gemini API
        const payload = {
            contents: [{
                parts: []
            }]
        };

        // Add text message
        payload.contents[0].parts.push({
            text: message
        });

        // Add image if provided
        if (imageData) {
            payload.contents[0].parts.push({
                inline_data: {
                    mime_type: imageData.mimeType || 'image/jpeg',
                    data: imageData.data
                }
            });
        }

        // Add system prompt for agricultural context
        const systemPrompt = `You are an AI agricultural advisor for Indian farmers. Provide helpful, accurate, and practical farming advice in ${language === 'hi' ? 'Hindi' : language === 'ml' ? 'Malayalam' : 'English'}. Focus on:
- Crop management and cultivation techniques
- Pest and disease identification and treatment
- Soil health and fertilization
- Weather-based farming decisions
- Government schemes and subsidies
- Market prices and trends
- Sustainable farming practices

Keep responses concise, practical, and relevant to Indian agricultural conditions.`;

        payload.contents[0].parts[0].text = `${systemPrompt}\n\nUser Question: ${message}`;

        // Call Gemini API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000 // 30 second timeout
            }
        );

        if (response.data && response.data.candidates && response.data.candidates[0]) {
            const aiResponse = response.data.candidates[0].content.parts[0].text;

            res.json({
                success: true,
                data: {
                    message: aiResponse,
                    timestamp: new Date().toISOString(),
                    language: language,
                    hasImage: !!imageData
                }
            });
        } else {
            throw new Error('Invalid response from Gemini API');
        }

    } catch (error) {
        console.error('Gemini API Error:', error);
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        if (error.response) {
            // API returned an error response
            const status = error.response.status;
            const message = error.response.data?.error?.message || error.response.data?.message || 'API request failed';

            res.status(status).json({
                error: 'Gemini API error',
                message: message,
                status: status,
                details: process.env.NODE_ENV === 'development' ? error.response.data : undefined
            });
        } else if (error.code === 'ECONNABORTED') {
            // Timeout error
            res.status(408).json({
                error: 'Request timeout',
                message: 'The AI service is taking too long to respond. Please try again.'
            });
        } else {
            // Other errors
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to process your request. Please try again.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

// POST /api/chat/quick-action - Handle quick action queries
router.post('/quick-action', validateGeminiKey, async (req, res) => {
    try {
        const { action, language = 'en', location = null } = req.body;

        if (!action) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Action is required'
            });
        }

        // Map quick actions to specific prompts
        const actionPrompts = {
            'pest_control': 'Provide comprehensive pest control advice for Indian crops including identification, prevention, and treatment methods.',
            'crop_diseases': 'Help identify and treat common crop diseases in India with organic and chemical solutions.',
            'fertilizers': 'Advise on appropriate fertilizers, organic manures, and soil nutrition for Indian farming conditions.',
            'weather_advice': 'Provide weather-based farming advice and seasonal recommendations.',
            'market_prices': 'Share information about current agricultural market trends and pricing strategies.',
            'government_subsidies': 'Inform about available government schemes, subsidies, and agricultural support programs.'
        };

        const prompt = actionPrompts[action] || `Provide helpful agricultural advice about ${action}.`;
        const locationContext = location ? ` for the ${location} region` : '';

        const message = `${prompt}${locationContext}. Please provide practical, actionable advice suitable for Indian farmers.`;

        // Use the same message endpoint
        req.body.message = message;
        req.body.language = language;

        // Call the message handler
        return router.handle({ ...req, url: '/message', method: 'POST' }, res);

    } catch (error) {
        console.error('Quick action error:', error);
        res.status(500).json({
            error: 'Failed to process quick action',
            message: error.message
        });
    }
});

// GET /api/chat/health - Health check for chat service
router.get('/health', (req, res) => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;

    res.json({
        success: true,
        service: 'chat',
        gemini_api_configured: hasApiKey,
        timestamp: new Date().toISOString()
    });
});

// GET /api/chat/test - Test Gemini API connection
router.get('/test', validateGeminiKey, async (req, res) => {
    try {
        console.log('Testing Gemini API connection...');
        console.log('API Key (first 10 chars):', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

        const testPayload = {
            contents: [{
                parts: [{
                    text: 'Hello, please respond with "AI Agricultural Advisor is working correctly" to confirm the connection.'
                }]
            }]
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        console.log('API URL:', apiUrl.replace(process.env.GEMINI_API_KEY, 'API_KEY_HIDDEN'));

        const response = await axios.post(
            apiUrl,
            testPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            }
        );

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.candidates && response.data.candidates[0]) {
            const aiResponse = response.data.candidates[0].content.parts[0].text;

            res.json({
                success: true,
                message: 'Gemini API connection successful',
                response: aiResponse,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Invalid response from Gemini API');
        }

    } catch (error) {
        console.error('Gemini API test error:', error);
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        res.status(500).json({
            success: false,
            error: 'Gemini API test failed',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            } : undefined
        });
    }
});

module.exports = router;
