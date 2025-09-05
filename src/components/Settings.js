import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Settings = ({ config }) => {
  const { translate, currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2>
            <i className="fas fa-cog"></i>
            {translate('settings')}
          </h2>
        </div>

        <div className="p-4">
          {/* Language Settings */}
          <div className="settings-section">
            <h3>
              <i className="fas fa-language"></i>
              {translate('language')}
            </h3>
            <div className="language-selector">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`btn ${currentLanguage === lang.code ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Location Settings */}
          <div className="settings-section">
            <h3>
              <i className="fas fa-map-marker-alt"></i>
              Location
            </h3>
            <div className="location-info">
              <p>
                <strong>Current Location:</strong> {config.location?.city || 'Not detected'}
              </p>
              {config.location?.lat && (
                <p>
                  <strong>Coordinates:</strong> {config.location.lat.toFixed(4)}, {config.location.lon.toFixed(4)}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                <i className="fas fa-sync-alt"></i>
                Refresh Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;