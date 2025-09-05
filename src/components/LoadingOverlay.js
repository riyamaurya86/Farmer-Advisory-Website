import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LoadingOverlay = () => {
  const { translate } = useLanguage();

  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
        <p>{translate('processing')}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
