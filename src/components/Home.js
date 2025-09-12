import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Home.css';

const Home = ({ onTabChange }) => {
  const { translate } = useLanguage();
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsVideoLoaded(true);
      video.style.opacity = '1';
      console.log('✅ Background video loaded successfully');
    };

    const handleError = (e) => {
      console.warn('❌ Video failed to load:', e);
      handleVideoError();
    };

    const handleCanPlayThrough = () => {
      video.play().catch(e => {
        console.warn('Video autoplay failed:', e);
        setShowPlayButton(true);
      });
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('canplaythrough', handleCanPlayThrough);

    // Optimize video quality based on device capabilities
    const isLowEndDevice = navigator.hardwareConcurrency < 4 ||
      navigator.connection?.effectiveType === 'slow-2g' ||
      navigator.connection?.effectiveType === '2g';

    if (isLowEndDevice) {
      video.style.filter = 'blur(1px)';
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, []);

  useEffect(() => {
    // Parallax effect for video background
    const handleScroll = () => {
      if (videoRef.current && isVideoLoaded) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        videoRef.current.style.transform = `translateY(${rate}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVideoLoaded]);

  useEffect(() => {
    // Animate feature cards on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'slideInUp 0.6s ease-out forwards';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach(card => {
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  const handleVideoError = () => {
    const videoBackground = document.querySelector('.video-background');
    if (videoBackground) {
      videoBackground.style.background = `
        linear-gradient(135deg, 
          rgba(76, 175, 80, 0.8) 0%, 
          rgba(102, 126, 234, 0.7) 50%, 
          rgba(255, 107, 53, 0.6) 100%
        ),
        url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>')
      `;
    }
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setShowPlayButton(false);
    }
  };

  const features = [
    {
      icon: 'fas fa-brain',
      title: translate('aiAdvice'),
      description: translate('aiAdviceDesc')
    },
    {
      icon: 'fas fa-microphone',
      title: translate('voiceInput'),
      description: translate('voiceInputDesc')
    },
    {
      icon: 'fas fa-camera',
      title: translate('imageAnalysis'),
      description: translate('imageAnalysisDesc')
    },
    {
      icon: 'fas fa-cloud-sun',
      title: translate('weatherIntegration'),
      description: translate('weatherIntegrationDesc')
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section with Video Background */}
      <section className="hero-section">
        <div className="video-background">
          <video
            ref={videoRef}
            className="background-video"
            autoPlay
            muted
            loop
            playsInline
            style={{ opacity: 0 }}
          >
            <source src="/Video Banner Stock Videos - Rural, Farming, Agriculture, Nature.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {showPlayButton && (
            <button className="video-play-btn" onClick={handlePlayVideo}>
              <i className="fas fa-play"></i>
            </button>
          )}

          <div className="video-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="container">
            <h1 className="hero-title">{translate('heroTitle')}</h1>
            <p className="hero-subtitle">{translate('heroSubtitle')}</p>
            <p className="hero-description">{translate('heroDescription')}</p>

            <div className="hero-buttons">
              <button
                className="btn btn-primary btn-large"
                onClick={() => onTabChange('chat')}
              >
                <i className="fas fa-rocket"></i>
                {translate('getStarted')}
              </button>
              <button
                className="btn btn-secondary btn-large"
                onClick={() => onTabChange('weather')}
              >
                <i className="fas fa-info-circle"></i>
                {translate('learnMore')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Farming?</h2>
            <p>Join thousands of farmers who are already using AI-powered agricultural advice</p>
            <button
              className="btn btn-primary btn-large pulse"
              onClick={() => onTabChange('chat')}
            >
              <i className="fas fa-comments"></i>
              Start Chatting Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
