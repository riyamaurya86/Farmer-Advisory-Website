import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { weatherAPI } from '../services/apiService';

const Weather = ({ config }) => {
  const { translate } = useLanguage();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherData();
  }, [config]);

  const fetchWeatherData = async () => {
    if (!config.location.lat || !config.location.lon) {
      setError('Location not available. Please enable location access.');
      setLoading(false);
      return;
    }

    try {
      const response = await weatherAPI.getCurrent(config.location.lat, config.location.lon);
      setWeatherData(response.data);
      setError(null);
    } catch (err) {
      console.error('Weather API error:', err);
      setError(err.response?.data?.message || 'Failed to fetch weather data. Please check backend configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2>
              <i className="fas fa-cloud-sun"></i>
              {translate('currentWeather')}
            </h2>
          </div>
          <div className="text-center p-4">
            <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
            <p className="mt-2">{translate('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2>
              <i className="fas fa-cloud-sun"></i>
              {translate('currentWeather')}
            </h2>
          </div>
          <div className="text-center p-4">
            <i className="fas fa-exclamation-triangle fa-2x text-muted"></i>
            <p className="mt-2 text-muted">
              {error || 'Weather data unavailable. Please check backend configuration.'}
            </p>
            <button
              onClick={fetchWeatherData}
              className="btn btn-primary mt-2"
            >
              <i className="fas fa-refresh"></i>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2>
            <i className="fas fa-cloud-sun"></i>
            {translate('currentWeather')}
          </h2>
        </div>

        {weatherData && (
          <div className="p-4">
            <div className="grid grid-2">
              <div className="weather-main">
                <h3 className="text-center mb-3">{weatherData.city}</h3>
                <div className="text-center">
                  <div className="weather-icon">
                    <img
                      src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                      alt={weatherData.description}
                    />
                  </div>
                  <h1 className="temperature">{Math.round(weatherData.temperature)}°C</h1>
                  <p className="weather-description">{weatherData.description}</p>
                </div>
              </div>

              <div className="weather-details">
                <div className="weather-item">
                  <i className="fas fa-thermometer-half"></i>
                  <span>Feels like: {Math.round(weatherData.feels_like)}°C</span>
                </div>
                <div className="weather-item">
                  <i className="fas fa-tint"></i>
                  <span>{translate('humidity')}: {weatherData.humidity}%</span>
                </div>
                <div className="weather-item">
                  <i className="fas fa-wind"></i>
                  <span>{translate('windSpeed')}: {weatherData.wind_speed} m/s</span>
                </div>
                <div className="weather-item">
                  <i className="fas fa-eye"></i>
                  <span>Visibility: {(weatherData.visibility / 1000).toFixed(1)} km</span>
                </div>
                <div className="weather-item">
                  <i className="fas fa-compress-arrows-alt"></i>
                  <span>Pressure: {weatherData.pressure} hPa</span>
                </div>
              </div>
            </div>

            <div className="farming-advice mt-4">
              <h4><i className="fas fa-seedling"></i> Farming Recommendations</h4>
              <div className="advice-cards">
                {getFarmingAdvice(weatherData).map((advice, index) => (
                  <div key={index} className="advice-card">
                    <i className={advice.icon}></i>
                    <p>{advice.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getFarmingAdvice = (weather) => {
  const temp = weather.temperature;
  const humidity = weather.humidity;
  const windSpeed = weather.wind_speed;
  const condition = weather.description.toLowerCase();

  const advice = [];

  // Temperature-based advice
  if (temp > 35) {
    advice.push({
      icon: 'fas fa-sun',
      text: 'High temperature alert! Increase irrigation frequency and provide shade for sensitive crops.'
    });
  } else if (temp < 5) {
    advice.push({
      icon: 'fas fa-snowflake',
      text: 'Cold weather warning! Protect crops from frost and consider covering sensitive plants.'
    });
  }

  // Humidity-based advice
  if (humidity > 80) {
    advice.push({
      icon: 'fas fa-tint',
      text: 'High humidity may increase disease risk. Ensure good air circulation and monitor for fungal issues.'
    });
  } else if (humidity < 30) {
    advice.push({
      icon: 'fas fa-fire',
      text: 'Low humidity detected. Increase irrigation and consider mulching to retain soil moisture.'
    });
  }

  // Weather condition advice
  if (condition.includes('rain')) {
    advice.push({
      icon: 'fas fa-cloud-rain',
      text: 'Rainy conditions. Avoid heavy machinery use and ensure proper drainage in fields.'
    });
  } else if (condition.includes('clear')) {
    advice.push({
      icon: 'fas fa-sun',
      text: 'Clear weather is ideal for spraying, harvesting, and field operations.'
    });
  }

  // Wind-based advice
  if (windSpeed > 10) {
    advice.push({
      icon: 'fas fa-wind',
      text: 'Strong winds detected. Avoid pesticide spraying and secure loose structures.'
    });
  }

  // Default advice if no specific conditions
  if (advice.length === 0) {
    advice.push({
      icon: 'fas fa-leaf',
      text: 'Good weather conditions for general farming activities. Monitor crops regularly.'
    });
  }

  return advice;
};

export default Weather;
