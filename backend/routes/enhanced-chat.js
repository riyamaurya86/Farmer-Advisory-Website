const express = require('express');
const axios = require('axios');
const database = require('../config/database');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

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

// Middleware to ensure database connection
const ensureDatabaseConnection = async (req, res, next) => {
    try {
        if (!database.isConnected) {
            await database.connect();
        }
        next();
    } catch (error) {
        res.status(500).json({
            error: 'Database connection failed',
            message: error.message
        });
    }
};

// Helper function to load top 10 crops data
async function loadTop10CropsData() {
    try {
        const filePath = path.join(__dirname, '../../public/data/top10_crops_kerala.xlsx');

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Process the data
        const processedData = processTop10CropsData(jsonData);
        return processedData;
    } catch (error) {
        console.error('Error loading top 10 crops data:', error);
        return null;
    }
}

// Helper function to load crop market data
async function loadCropMarketData(cropName) {
    try {
        const fileName = `${cropName}.xlsx`;
        const filePath = path.join(__dirname, '../../public/data', fileName);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const workbook = XLSX.readFile(filePath);
        const months = workbook.SheetNames;

        if (months.length > 0) {
            const worksheet = workbook.Sheets[months[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const processedData = processCropMarketData(jsonData, cropName, months[0]);
            return {
                data: processedData,
                availableMonths: months
            };
        }

        return null;
    } catch (error) {
        console.error(`Error loading ${cropName} market data:`, error);
        return null;
    }
}

// Helper function to get user's farming records
async function getUserFarmingRecords() {
    try {
        const collection = database.getCollection('farming_records');
        const records = await collection.find({}).sort({ createdAt: -1 }).limit(10).toArray();

        return records.map(record => ({
            cropName: record.cropName,
            plantingDate: record.plantingDate,
            expectedHarvest: record.expectedHarvest,
            notes: record.notes,
            soilType: record.soilType || 'Not specified'
        }));
    } catch (error) {
        console.error('Error fetching farming records:', error);
        return [];
    }
}

// Helper function to get current weather data
async function getCurrentWeatherData(lat, lon) {
    try {
        if (!process.env.WEATHER_API_KEY) {
            return null;
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );

        return {
            temperature: response.data.main.temp,
            humidity: response.data.main.humidity,
            description: response.data.weather[0].description,
            wind_speed: response.data.wind.speed,
            city: response.data.name
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// POST /api/enhanced-chat/message - Enhanced chatbot with context
router.post('/message', validateGeminiKey, ensureDatabaseConnection, async (req, res) => {
    try {
        const { message, language = 'en', location = null, imageData = null } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Message is required'
            });
        }

        // Gather context data
        const context = await gatherContextData(location);

        // Build enhanced prompt
        const enhancedPrompt = buildEnhancedPrompt(message, context, language);

        // Prepare the request payload for Gemini API
        const payload = {
            contents: [{
                parts: [{
                    text: enhancedPrompt
                }]
            }]
        };

        // Add image if provided
        if (imageData) {
            payload.contents[0].parts.push({
                inline_data: {
                    mime_type: imageData.mimeType || 'image/jpeg',
                    data: imageData.data
                }
            });
        }

        // Call Gemini API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.candidates && response.data.candidates[0]) {
            const aiResponse = response.data.candidates[0].content.parts[0].text;

            res.json({
                success: true,
                data: {
                    message: aiResponse,
                    context: {
                        weather: context.weather,
                        records: context.records.length,
                        topCrops: context.topCrops?.crops?.length || 0,
                        marketData: context.marketData ? 'Available' : 'Not available'
                    },
                    timestamp: new Date().toISOString(),
                    language: language,
                    hasImage: !!imageData
                }
            });
        } else {
            throw new Error('Invalid response from Gemini API');
        }

    } catch (error) {
        console.error('Enhanced Chat API Error:', error);

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.error?.message || error.response.data?.message || 'API request failed';

            res.status(status).json({
                error: 'Gemini API error',
                message: message,
                status: status
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to process your request. Please try again.'
            });
        }
    }
});

// Helper function to gather all context data
async function gatherContextData(location) {
    const context = {
        weather: null,
        records: [],
        topCrops: null,
        marketData: null
    };

    try {
        // Get weather data if location is provided
        if (location && location.lat && location.lon) {
            context.weather = await getCurrentWeatherData(location.lat, location.lon);
        }

        // Get farming records
        context.records = await getUserFarmingRecords();

        // Get top 10 crops data
        context.topCrops = await loadTop10CropsData();

        // Get market data for the most recent crop if available
        if (context.records.length > 0) {
            const recentCrop = context.records[0].cropName;
            const marketData = await loadCropMarketData(recentCrop);
            if (marketData) {
                context.marketData = marketData.data;
            }
        }

    } catch (error) {
        console.error('Error gathering context data:', error);
    }

    return context;
}

// Helper function to build enhanced prompt
function buildEnhancedPrompt(userMessage, context, language) {
    const langText = language === 'hi' ? 'Hindi' : language === 'ml' ? 'Malayalam' : 'English';

    let prompt = `You are a Digital Krishi Officer, an advanced AI agricultural advisor for Indian farmers. Provide comprehensive, accurate, and practical farming advice in ${langText}.

CONTEXT INFORMATION:

`;

    // Add weather context
    if (context.weather) {
        prompt += `CURRENT WEATHER CONDITIONS:
- Location: ${context.weather.city}
- Temperature: ${Math.round(context.weather.temperature)}°C
- Humidity: ${context.weather.humidity}%
- Weather: ${context.weather.description}
- Wind Speed: ${context.weather.wind_speed} m/s

`;
    }

    // Add farming records context
    if (context.records.length > 0) {
        prompt += `USER'S FARMING RECORDS (Recent crops grown):
`;
        context.records.slice(0, 5).forEach((record, index) => {
            prompt += `${index + 1}. ${record.cropName} - Planted: ${record.plantingDate}`;
            if (record.soilType) {
                prompt += `, Soil Type: ${record.soilType}`;
            }
            if (record.notes) {
                prompt += `, Notes: ${record.notes}`;
            }
            prompt += '\n';
        });
        prompt += '\n';
    }

    // Add top crops context
    if (context.topCrops && context.topCrops.crops.length > 0) {
        prompt += `TOP CROPS IN KERALA (for reference):
`;
        context.topCrops.crops.slice(0, 5).forEach((crop, index) => {
            prompt += `${index + 1}. ${crop.name} - Area: ${crop.area}, Production: ${crop.production}\n`;
        });
        prompt += '\n';
    }

    // Add market data context
    if (context.marketData) {
        prompt += `MARKET DATA FOR ${context.marketData.cropName.toUpperCase()}:
- Current Month: ${context.marketData.month}
- Average Price: ₹${context.marketData.summary.avgPrice.toFixed(2)} per unit
- Price Range: ₹${context.marketData.summary.priceRange.min} - ₹${context.marketData.summary.priceRange.max}
- Districts with data: ${context.marketData.summary.totalDistricts}

`;
    }

    prompt += `USER QUERY: ${userMessage}

INSTRUCTIONS:
1. Provide specific, actionable advice based on the context provided
2. Consider weather conditions for farming recommendations
3. Reference the user's farming history when relevant
4. Suggest crops from the top crops list when appropriate
5. Include market price considerations when discussing crops
6. Provide soil-specific advice when soil type is mentioned
7. Keep responses practical and relevant to Indian/Kerala farming conditions
8. Include specific recommendations for pest control, fertilization, and crop management
9. Mention government schemes or subsidies when relevant
10. Provide seasonal and weather-based farming tips

FORMATTING REQUIREMENTS:
- Use **bold text** for important points and recommendations
- Use *italic text* for emphasis and technical terms
- Use bullet points (-) for lists of recommendations
- Use numbered lists (1.) for step-by-step instructions
- Use ### headings for different sections (e.g., ### Weather-Based Advice)
- Use > blockquotes for important warnings or tips
- Use \`code\` for specific measurements, temperatures, or technical terms
- Structure your response with clear sections for better readability

Please provide comprehensive advice that considers all available context with proper Markdown formatting.`;

    return prompt;
}

// Helper function to process top 10 crops data
function processTop10CropsData(rawData) {
    if (!rawData || rawData.length === 0) {
        return { crops: [] };
    }

    // Find the header row
    let headerRowIndex = -1;
    let headers = [];

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 0 &&
            (row[0] === 'Crop' || row[0] === 'Crop Name' || row[0] === 'Name')) {
            headerRowIndex = i;
            headers = row;
            break;
        }
    }

    if (headerRowIndex === -1) {
        headers = rawData[0] || ['Crop', 'Area', 'Production', 'Yield'];
        headerRowIndex = 0;
    }

    const dataRows = rawData.slice(headerRowIndex + 1).filter(row =>
        row && row.length > 0 && row[0] && row[0] !== ''
    );

    const crops = dataRows.map((row, index) => ({
        rank: index + 1,
        name: row[0] || `Crop ${index + 1}`,
        area: row[1] || 'N/A',
        production: row[2] || 'N/A',
        yield: row[3] || 'N/A'
    }));

    return {
        crops: crops.slice(0, 10),
        summary: {
            totalCrops: crops.length,
            headers: headers
        }
    };
}

// Helper function to process crop market data
function processCropMarketData(rawData, cropName, month) {
    if (!rawData || rawData.length < 4) {
        return null;
    }

    let headerRowIndex = -1;
    let headers = [];

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 0 && row[0] === 'District') {
            headerRowIndex = i;
            headers = row;
            break;
        }
    }

    if (headerRowIndex === -1) {
        return null;
    }

    const dataRows = rawData.slice(headerRowIndex + 1).filter(row =>
        row && row.length > 0 && row[0] && row[0] !== ''
    );

    const prices = dataRows.map(row => {
        const price = row[1];
        return typeof price === 'number' ? price : parseFloat(price) || 0;
    }).filter(p => p > 0);

    const avgPrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    const priceRange = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 };

    return {
        cropName,
        month,
        headers: headers,
        data: dataRows,
        summary: {
            totalDistricts: dataRows.length,
            avgPrice: avgPrice,
            priceRange: priceRange
        }
    };
}

// GET /api/enhanced-chat/context - Get current context data
router.get('/context', ensureDatabaseConnection, async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const location = lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null;

        const context = await gatherContextData(location);

        res.json({
            success: true,
            data: context,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting context:', error);
        res.status(500).json({
            error: 'Failed to get context data',
            message: error.message
        });
    }
});

// GET /api/enhanced-chat/health - Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'enhanced-chat',
        gemini_api_configured: !!process.env.GEMINI_API_KEY,
        weather_api_configured: !!process.env.WEATHER_API_KEY,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
