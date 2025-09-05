# Digital Krishi Officer - AI Agricultural Advisory System

A comprehensive AI-powered agricultural advisory system designed to help farmers get instant, expert-level farming advice in their preferred language (English, Hindi, Malayalam).

## Features

### 🌱 Core Functionality

- **Multilingual Support**: Full support for English, Hindi, and Malayalam
- **Natural Language Processing**: Ask questions in natural language via text or voice
- **Image Analysis**: Upload crop photos for disease identification and treatment recommendations
- **Voice Input**: Speak your questions in your preferred language
- **Location-Aware**: Provides context-specific advice based on your location and weather
- **Quick Actions**: Pre-defined common farming questions for instant answers

### 🚀 Technical Features

- **Progressive Web App (PWA)**: Install on mobile devices like a native app
- **Offline Support**: Basic functionality works without internet connection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Weather Integration**: Uses OpenWeather API for current conditions
- **AI-Powered Responses**: Integrates with Google Gemini API for intelligent responses

## Setup Instructions

### 1. API Keys Configuration

You need to obtain and configure the following API keys:

#### Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Replace `YOUR_GEMINI_API_KEY` in `app.js` with your actual key

#### OpenWeather API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key
3. Replace `YOUR_OPENWEATHER_API_KEY` in `app.js` with your actual key

### 2. Local Development

1. Clone or download the project files
2. Open `app.js` and add your API keys
3. Serve the files using a local web server:

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .

   # Using PHP
   php -S localhost:8000
   ```

4. Open `http://localhost:8000` in your browser

### 3. Mobile Installation (PWA)

1. Open the app in a mobile browser (Chrome, Safari, etc.)
2. Look for "Add to Home Screen" or "Install App" option
3. Follow the prompts to install as a native app

## File Structure

```
digital-krishi-officer/
├── index.html          # Main HTML structure
├── styles.css          # Responsive CSS styling
├── app.js             # Main application logic
├── translations.js     # Multilingual translations
├── manifest.json      # PWA manifest
├── service-worker.js  # PWA service worker
└── README.md          # This file
```

## Usage Guide

### Text Input

1. Select "Text" mode
2. Type your agricultural question in any supported language
3. Press Enter or click the send button

### Voice Input

1. Select "Voice" mode
2. Click "Start Recording"
3. Speak your question clearly
4. The system will automatically process your speech

### Image Analysis

1. Select "Image" mode
2. Click "Upload Crop Image"
3. Select a photo of your crop/plant
4. Click "Analyze Image" for AI-powered diagnosis

### Quick Actions

Use the predefined buttons for common questions:

- Pest Control
- Crop Diseases
- Fertilizers
- Weather Advice
- Market Prices
- Government Subsidies

## Supported Languages

- **English**: Full support with comprehensive agricultural knowledge
- **Hindi**: Complete translation and Hindi language processing
- **Malayalam**: Native Malayalam support for Kerala farmers

## Browser Compatibility

- Chrome 60+ (recommended)
- Firefox 55+
- Safari 11+
- Edge 79+

## Deployment Options

### Web Hosting

Upload all files to any web hosting service:

- Netlify (recommended for easy deployment)
- Vercel
- GitHub Pages
- Traditional web hosting

### Mobile App Deployment

The PWA can be:

- Installed directly from browsers
- Packaged as native apps using tools like Capacitor or Cordova
- Distributed through app stores

## Contributing

This system is designed to be extensible. You can:

1. Add more languages in `translations.js`
2. Expand the knowledge base with local agricultural data
3. Add more quick action categories
4. Integrate with additional APIs for enhanced functionality

## Security Notes

- Never commit API keys to version control
- Use environment variables for production deployments
- Implement rate limiting for API calls in production
- Consider using a backend service for sensitive API operations

## Support

For technical support or feature requests, please refer to your local agricultural extension services or Krishi Vigyan Kendras for agricultural guidance.

---

**Digital Krishi Officer** - Empowering farmers with AI-driven agricultural intelligence.
