const express = require('express');
const axios = require('axios');

const router = express.Router();

// Middleware to validate Weather API key
const validateWeatherKey = (req, res, next) => {
    if (!process.env.WEATHER_API_KEY) {
        return res.status(500).json({
            error: 'Weather API key not configured',
            message: 'Please configure WEATHER_API_KEY in environment variables'
        });
    }
    next();
};

// GET /api/weather/current - Get current weather by coordinates
router.get('/current', validateWeatherKey, async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Latitude and longitude are required'
            });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );

        const weatherData = {
            temperature: response.data.main.temp,
            feels_like: response.data.main.feels_like,
            humidity: response.data.main.humidity,
            pressure: response.data.main.pressure,
            description: response.data.weather[0].description,
            icon: response.data.weather[0].icon,
            wind_speed: response.data.wind.speed,
            wind_direction: response.data.wind.deg,
            visibility: response.data.visibility,
            city: response.data.name,
            country: response.data.sys.country,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: weatherData
        });

    } catch (error) {
        console.error('Weather API Error:', error);

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'Weather API request failed';

            res.status(status).json({
                error: 'Weather API error',
                message: message,
                status: status
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch weather data'
            });
        }
    }
});

// GET /api/weather/forecast - Get weather forecast by coordinates
router.get('/forecast', validateWeatherKey, async (req, res) => {
    try {
        const { lat, lon, days = 5 } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Latitude and longitude are required'
            });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );

        // Process forecast data to get daily summaries
        const forecastData = response.data.list.slice(0, days * 8).map(item => ({
            date: new Date(item.dt * 1000).toISOString().split('T')[0],
            time: new Date(item.dt * 1000).toISOString(),
            temperature: item.main.temp,
            feels_like: item.main.feels_like,
            humidity: item.main.humidity,
            pressure: item.main.pressure,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            wind_speed: item.wind.speed,
            wind_direction: item.wind.deg,
            precipitation: item.rain ? item.rain['3h'] || 0 : 0
        }));

        // Group by date and get daily summaries
        const dailyForecast = {};
        forecastData.forEach(item => {
            const date = item.date;
            if (!dailyForecast[date]) {
                dailyForecast[date] = {
                    date: date,
                    min_temp: item.temperature,
                    max_temp: item.temperature,
                    avg_humidity: item.humidity,
                    description: item.description,
                    icon: item.icon,
                    precipitation: item.precipitation
                };
            } else {
                dailyForecast[date].min_temp = Math.min(dailyForecast[date].min_temp, item.temperature);
                dailyForecast[date].max_temp = Math.max(dailyForecast[date].max_temp, item.temperature);
                dailyForecast[date].avg_humidity = (dailyForecast[date].avg_humidity + item.humidity) / 2;
                dailyForecast[date].precipitation += item.precipitation;
            }
        });

        const forecastArray = Object.values(dailyForecast);

        res.json({
            success: true,
            data: {
                city: response.data.city.name,
                country: response.data.city.country,
                forecast: forecastArray,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Weather Forecast API Error:', error);

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'Weather forecast API request failed';

            res.status(status).json({
                error: 'Weather forecast API error',
                message: message,
                status: status
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch weather forecast'
            });
        }
    }
});

// GET /api/weather/agricultural-advice - Get weather-based agricultural advice
router.get('/agricultural-advice', validateWeatherKey, async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Latitude and longitude are required'
            });
        }

        // Get current weather
        const currentResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );

        const weather = currentResponse.data;
        const advice = generateAgriculturalAdvice(weather);

        res.json({
            success: true,
            data: {
                weather: {
                    temperature: weather.main.temp,
                    humidity: weather.main.humidity,
                    description: weather.weather[0].description,
                    wind_speed: weather.wind.speed
                },
                advice: advice,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Agricultural advice error:', error);
        res.status(500).json({
            error: 'Failed to generate agricultural advice',
            message: error.message
        });
    }
});

// Helper function to generate agricultural advice based on weather
function generateAgriculturalAdvice(weather) {
    const temp = weather.main.temp;
    const humidity = weather.main.humidity;
    const windSpeed = weather.wind.speed;
    const description = weather.weather[0].description.toLowerCase();

    const advice = [];

    // Temperature-based advice
    if (temp < 10) {
        advice.push("Cold weather detected. Consider protecting sensitive crops with covers or greenhouses.");
    } else if (temp > 35) {
        advice.push("Hot weather detected. Ensure adequate irrigation and consider shade for heat-sensitive crops.");
    } else if (temp >= 20 && temp <= 30) {
        advice.push("Optimal temperature range for most crops. Good time for planting and growth activities.");
    }

    // Humidity-based advice
    if (humidity > 80) {
        advice.push("High humidity detected. Watch for fungal diseases and ensure good air circulation.");
    } else if (humidity < 30) {
        advice.push("Low humidity detected. Increase irrigation frequency and consider mulching to retain moisture.");
    }

    // Wind-based advice
    if (windSpeed > 10) {
        advice.push("Strong winds detected. Secure any temporary structures and avoid spraying pesticides.");
    }

    // Weather condition advice
    if (description.includes('rain')) {
        advice.push("Rainy conditions. Avoid field work and check drainage systems.");
    } else if (description.includes('clear') || description.includes('sunny')) {
        advice.push("Clear weather. Good conditions for field work, planting, and harvesting.");
    } else if (description.includes('cloud')) {
        advice.push("Cloudy conditions. Suitable for transplanting and reducing plant stress.");
    }

    return advice.length > 0 ? advice : ["Weather conditions are generally favorable for agricultural activities."];
}

// GET /api/weather/health - Health check for weather service
router.get('/health', (req, res) => {
    const hasApiKey = !!process.env.WEATHER_API_KEY;

    res.json({
        success: true,
        service: 'weather',
        weather_api_configured: hasApiKey,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
