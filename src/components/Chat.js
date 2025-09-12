import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { chatAPI, enhancedChatAPI } from '../services/apiService';
import MarkdownRenderer from './MarkdownRenderer';
import './Chat.css';

const Chat = ({ config, selectedLocation, setIsLoading }) => {
  const { translate, currentLanguage } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: translate('heroDescription'),
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = getLanguageCode(currentLanguage);

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [currentLanguage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLanguageCode = (lang) => {
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ml': 'ml-IN'
    };
    return langMap[lang] || 'en-US';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type, content, imageUrl = null) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      imageUrl,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const buildPrompt = (query, context = {}) => {
    const { location, weather } = context;

    let prompt = `You are a Digital Krishi Officer, an AI agricultural advisor. Provide helpful, accurate farming advice in ${currentLanguage === 'hi' ? 'Hindi' : currentLanguage === 'ml' ? 'Malayalam' : 'English'}.

Context:
- User Location: ${location?.city || 'Unknown'}
- Current Weather: ${weather ? `${weather.main}, ${Math.round(weather.temp - 273.15)}°C` : 'Not available'}
- Language: ${currentLanguage}

User Query: ${query}

Provide practical, actionable advice for farmers. Include specific recommendations, best practices, and relevant agricultural techniques.`;

    return prompt;
  };

  const callGeminiAPI = async (query, context = {}) => {
    try {
      // Use selected location if available, otherwise fall back to GPS location
      const locationToUse = selectedLocation || config.location;

      // Try enhanced chat first
      const response = await enhancedChatAPI.sendMessage(
        query,
        currentLanguage,
        locationToUse
      );
      return response.data.message;
    } catch (error) {
      console.error('Enhanced Chat API error:', error);

      // Fallback to regular chat
      try {
        const response = await chatAPI.sendMessage(query, currentLanguage);
        return response.data.message;
      } catch (fallbackError) {
        console.error('Backend API error:', fallbackError);

        if (fallbackError.response?.status === 500 && fallbackError.response?.data?.message?.includes('API key')) {
          return `⚠️ Backend Configuration Required: Please configure your Gemini API key in the backend environment variables to get AI-powered responses. 

For now, here's some general farming advice:
- Monitor soil moisture regularly
- Follow crop rotation practices
- Use organic fertilizers when possible
- Check weather forecasts before major farming activities
- Maintain proper spacing between plants`;
        }

        return `I apologize, but I'm having trouble connecting to the AI service right now. Please check your internet connection and try again. In the meantime, consider consulting local agricultural experts or extension services.`;
      }
    }
  };

  const analyzeImage = async (imageFile) => {
    try {
      // Convert image to base64
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(imageFile);
      });

      const imageData = {
        data: base64Image,
        mimeType: imageFile.type
      };

      const response = await enhancedChatAPI.sendMessage(
        `Analyze this agricultural image. Identify any crops, diseases, pests, or farming conditions visible. Provide specific recommendations for improvement, treatment, or best practices.`,
        currentLanguage,
        selectedLocation || config.location,
        imageData
      );

      return response.data.message;
    } catch (error) {
      console.error('Image analysis error:', error);
      return "I'm having trouble analyzing the image right now. Please ensure you have a stable internet connection and try again.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const context = {
        location: config.location,
        weather: null // Weather data would be fetched here if needed
      };

      const response = await callGeminiAPI(userMessage, context);
      addMessage('bot', response);
    } catch (error) {
      addMessage('bot', 'Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Create image URL for display
    const imageUrl = URL.createObjectURL(file);
    addMessage('user', 'Uploaded an image for analysis', imageUrl);
    setIsLoading(true);

    try {
      const analysis = await analyzeImage(file);
      addMessage('bot', analysis);
    } catch (error) {
      addMessage('bot', 'Sorry, I encountered an error analyzing the image. Please try again.');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="container">
        <div className="chat-card">
          <div className="chat-header">
            <h2>
              <i className="fas fa-comments"></i>
              {translate('chat')}
            </h2>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.imageUrl && (
                    <img src={message.imageUrl} alt="Uploaded" className="message-image" />
                  )}
                  {message.type === 'bot' ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <div className="input-group">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={translate('typeMessage')}
                className="form-input"
                disabled={isListening}
              />

              <button
                onClick={isListening ? stopListening : startListening}
                className={`btn btn-icon ${isListening ? 'listening' : ''}`}
                title={isListening ? translate('listening') : 'Start voice input'}
              >
                <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-icon"
                title={translate('uploadImage')}
              >
                <i className="fas fa-camera"></i>
              </button>

              <button
                onClick={handleSendMessage}
                className="btn btn-primary"
                disabled={!inputMessage.trim() || isListening}
              >
                <i className="fas fa-paper-plane"></i>
                {translate('send')}
              </button>
            </div>

            {isListening && (
              <div className="listening-indicator">
                <i className="fas fa-microphone pulse"></i>
                <span>{translate('listening')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
