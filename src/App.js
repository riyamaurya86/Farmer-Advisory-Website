import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Chat from './components/Chat';
import Weather from './components/Weather';
import Market from './components/Market';
import Records from './components/Records';
import Settings from './components/Settings';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(false);

  // API Configuration
  const [config, setConfig] = useState({
    geminiApiKey: '',
    weatherApiKey: '',
    location: { lat: null, lon: null, city: '' }
  });

  // Selected location for chatbot (can be different from GPS location)
  const [selectedLocation, setSelectedLocation] = useState(null);

  const loadApiKeys = useCallback(() => {
    const storedKeys = localStorage.getItem('apiKeys');
    if (storedKeys) {
      const keys = JSON.parse(storedKeys);
      setConfig(prev => ({
        ...prev,
        geminiApiKey: keys.gemini || '',
        weatherApiKey: keys.weather || ''
      }));
    }

    // Log API key status
    console.log('API Key Status:');
    console.log('Gemini API Key:', config.geminiApiKey ? 'Loaded ✓' : 'Missing ✗');
    console.log('Weather API Key:', config.weatherApiKey ? 'Loaded ✓' : 'Missing ✗');

    if (!config.geminiApiKey) {
      console.log('⚠️ Gemini API key not found.');
      console.log('To add your API key, run: setGeminiKey("your-api-key-here")');
    }
    if (!config.weatherApiKey) {
      console.log('⚠️ Weather API key not found.');
      console.log('To add your API key, run: setWeatherKey("your-api-key-here")');
    }
  }, [config.geminiApiKey, config.weatherApiKey]);

  useEffect(() => {
    loadApiKeys();
    getUserLocation();
  }, [loadApiKeys]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setConfig(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              city: 'Current Location'
            }
          }));
        },
        (error) => {
          console.warn('Location access denied:', error);
          // Default to a sample location
          setConfig(prev => ({
            ...prev,
            location: {
              lat: 28.6139,
              lon: 77.2090,
              city: 'New Delhi'
            }
          }));
        }
      );
    }
  };

  const updateApiKeys = (keys) => {
    setConfig(prev => ({ ...prev, ...keys }));
    const currentKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
    const updatedKeys = { ...currentKeys, ...keys };
    localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));
  };

  const handleLocationChange = (newLocation) => {
    setSelectedLocation(newLocation);
    console.log('Location changed to:', newLocation);
  };

  // Global functions for API key management (accessible from console)
  useEffect(() => {
    window.setGeminiKey = (key) => {
      updateApiKeys({ geminiApiKey: key });
      const storedKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
      storedKeys.gemini = key;
      localStorage.setItem('apiKeys', JSON.stringify(storedKeys));
      console.log('✅ Gemini API key saved successfully!');
    };

    window.setWeatherKey = (key) => {
      updateApiKeys({ weatherApiKey: key });
      const storedKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
      storedKeys.weather = key;
      localStorage.setItem('apiKeys', JSON.stringify(storedKeys));
      console.log('✅ Weather API key saved successfully!');
    };

    window.testApiKeys = async () => {
      console.log('🔍 Testing API connectivity...');

      // Test Gemini API
      if (config.geminiApiKey) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Hello' }] }]
            })
          });

          if (response.ok) {
            console.log('✅ Gemini API: Connected successfully');
          } else {
            console.log('❌ Gemini API: Connection failed -', response.status);
          }
        } catch (error) {
          console.log('❌ Gemini API: Connection error -', error.message);
        }
      } else {
        console.log('⚠️ Gemini API: No key configured');
      }

      // Test Weather API
      if (config.weatherApiKey && config.location.lat) {
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${config.location.lat}&lon=${config.location.lon}&appid=${config.weatherApiKey}`
          );

          if (response.ok) {
            console.log('✅ Weather API: Connected successfully');
          } else {
            console.log('❌ Weather API: Connection failed -', response.status);
          }
        } catch (error) {
          console.log('❌ Weather API: Connection error -', error.message);
        }
      } else {
        console.log('⚠️ Weather API: No key configured or location unavailable');
      }
    };

    return () => {
      // Cleanup global functions
      delete window.setGeminiKey;
      delete window.setWeatherKey;
      delete window.testApiKeys;
    };
  }, [config]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home onTabChange={setActiveTab} />;
      case 'chat':
        return <Chat config={config} selectedLocation={selectedLocation} setIsLoading={setIsLoading} />;
      case 'weather':
        return <Weather config={config} onLocationChange={handleLocationChange} />;
      case 'market':
        return <Market />;
      case 'records':
        return <Records />;
      case 'settings':
        return <Settings config={config} />;
      default:
        return <Home onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="app">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        {renderActiveTab()}
      </main>
      {isLoading && <LoadingOverlay />}
    </div>
  );
}

export default App;
