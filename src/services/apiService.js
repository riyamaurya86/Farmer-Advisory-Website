import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error);

        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;
            console.error(`API Error ${status}:`, data);
        } else if (error.request) {
            // Request was made but no response received
            console.error('No response received:', error.request);
        } else {
            // Something else happened
            console.error('Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

// Records API
export const recordsAPI = {
    // Get all records
    getAll: async () => {
        const response = await api.get('/records');
        return response.data;
    },

    // Create new record
    create: async (recordData) => {
        const response = await api.post('/records', recordData);
        return response.data;
    },

    // Update record
    update: async (id, recordData) => {
        const response = await api.put(`/records/${id}`, recordData);
        return response.data;
    },

    // Delete record
    delete: async (id) => {
        const response = await api.delete(`/records/${id}`);
        return response.data;
    },

    // Health check
    health: async () => {
        const response = await api.get('/records/health');
        return response.data;
    }
};

// Chat API
export const chatAPI = {
    // Send message to AI
    sendMessage: async (message, language = 'en', imageData = null) => {
        const response = await api.post('/chat/message', {
            message,
            language,
            imageData
        });
        return response.data;
    },

    // Quick action
    quickAction: async (action, language = 'en', location = null) => {
        const response = await api.post('/chat/quick-action', {
            action,
            language,
            location
        });
        return response.data;
    },

    // Test connection
    test: async () => {
        const response = await api.get('/chat/test');
        return response.data;
    },

    // Health check
    health: async () => {
        const response = await api.get('/chat/health');
        return response.data;
    }
};

// Weather API
export const weatherAPI = {
    // Get current weather
    getCurrent: async (lat, lon) => {
        const response = await api.get('/weather/current', {
            params: { lat, lon }
        });
        return response.data;
    },

    // Get weather forecast
    getForecast: async (lat, lon, days = 5) => {
        const response = await api.get('/weather/forecast', {
            params: { lat, lon, days }
        });
        return response.data;
    },

    // Get agricultural advice
    getAgriculturalAdvice: async (lat, lon) => {
        const response = await api.get('/weather/agricultural-advice', {
            params: { lat, lon }
        });
        return response.data;
    },

    // Health check
    health: async () => {
        const response = await api.get('/weather/health');
        return response.data;
    }
};

// General API utilities
export const apiUtils = {
    // Health check for all services
    healthCheck: async () => {
        try {
            const response = await api.get('/health');
            return response.data;
        } catch (error) {
            throw new Error('Backend service unavailable');
        }
    },

    // Test all API connections
    testConnections: async () => {
        const results = {
            backend: false,
            records: false,
            chat: false,
            weather: false
        };

        try {
            // Test backend
            await apiUtils.healthCheck();
            results.backend = true;

            // Test records service
            await recordsAPI.health();
            results.records = true;

            // Test chat service
            await chatAPI.health();
            results.chat = true;

            // Test weather service
            await weatherAPI.health();
            results.weather = true;
        } catch (error) {
            console.error('Connection test failed:', error);
        }

        return results;
    }
};

export default api;
