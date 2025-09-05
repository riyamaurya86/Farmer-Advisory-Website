import React, { createContext, useContext, useState, useEffect } from 'react';

// Translation data
const translations = {
  en: {
    appTitle: "Digital Krishi Officer",
    home: "Home",
    chat: "Chat",
    weather: "Weather",
    records: "Records",
    settings: "Settings",
    
    // Home page
    heroTitle: "Digital Krishi Officer",
    heroSubtitle: "AI-Powered Agricultural Advisory System",
    heroDescription: "Get instant expert advice for your farming needs through voice, text, or image analysis",
    getStarted: "Get Started",
    learnMore: "Learn More",
    
    // Features
    aiAdvice: "AI-Powered Advice",
    aiAdviceDesc: "Get intelligent farming recommendations powered by advanced AI",
    voiceInput: "Voice Recognition",
    voiceInputDesc: "Speak in your preferred language - Malayalam, Hindi, or English",
    imageAnalysis: "Image Analysis",
    imageAnalysisDesc: "Upload crop images for instant disease identification",
    weatherIntegration: "Weather Integration",
    weatherIntegrationDesc: "Location-based weather data for better farming decisions",
    
    // Chat interface
    typeMessage: "Type your farming question here...",
    send: "Send",
    listening: "Listening...",
    processing: "Processing your query...",
    uploadImage: "Upload Image",
    
    // Weather
    currentWeather: "Current Weather",
    temperature: "Temperature",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    
    // Records
    farmingRecords: "Farming Records",
    addRecord: "Add Record",
    cropName: "Crop Name",
    plantingDate: "Planting Date",
    expectedHarvest: "Expected Harvest",
    notes: "Notes",
    save: "Save",
    
    // Settings
    language: "Language",
    notifications: "Notifications",
    apiKeys: "API Keys",
    geminiKey: "Gemini API Key",
    weatherKey: "Weather API Key",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm"
  },
  
  hi: {
    appTitle: "डिजिटल कृषि अधिकारी",
    home: "होम",
    chat: "चैट",
    weather: "मौसम",
    records: "रिकॉर्ड",
    settings: "सेटिंग्स",
    
    // Home page
    heroTitle: "डिजिटल कृषि अधिकारी",
    heroSubtitle: "AI-संचालित कृषि सलाहकार प्रणाली",
    heroDescription: "आवाज, टेक्स्ट या छवि विश्लेषण के माध्यम से अपनी खेती की जरूरतों के लिए तुरंत विशेषज्ञ सलाह प्राप्त करें",
    getStarted: "शुरू करें",
    learnMore: "और जानें",
    
    // Features
    aiAdvice: "AI-संचालित सलाह",
    aiAdviceDesc: "उन्नत AI द्वारा संचालित बुद्धिमान खेती की सिफारिशें प्राप्त करें",
    voiceInput: "आवाज पहचान",
    voiceInputDesc: "अपनी पसंदीदा भाषा में बोलें - मलयालम, हिंदी या अंग्रेजी",
    imageAnalysis: "छवि विश्लेषण",
    imageAnalysisDesc: "तत्काल रोग पहचान के लिए फसल की छवियां अपलोड करें",
    weatherIntegration: "मौसम एकीकरण",
    weatherIntegrationDesc: "बेहतर खेती के फैसलों के लिए स्थान-आधारित मौसम डेटा",
    
    // Chat interface
    typeMessage: "यहाँ अपना खेती का सवाल टाइप करें...",
    send: "भेजें",
    listening: "सुन रहा है...",
    processing: "आपकी क्वेरी प्रोसेस कर रहा है...",
    uploadImage: "छवि अपलोड करें",
    
    // Weather
    currentWeather: "वर्तमान मौसम",
    temperature: "तापमान",
    humidity: "आर्द्रता",
    windSpeed: "हवा की गति",
    
    // Records
    farmingRecords: "खेती के रिकॉर्ड",
    addRecord: "रिकॉर्ड जोड़ें",
    cropName: "फसल का नाम",
    plantingDate: "रोपण की तारीख",
    expectedHarvest: "अपेक्षित फसल",
    notes: "नोट्स",
    save: "सेव करें",
    
    // Settings
    language: "भाषा",
    notifications: "सूचनाएं",
    apiKeys: "API कीज़",
    geminiKey: "Gemini API की",
    weatherKey: "मौसम API की",
    
    // Common
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफलता",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें"
  },
  
  ml: {
    appTitle: "ഡിജിറ്റൽ കൃഷി ഓഫീസർ",
    home: "ഹോം",
    chat: "ചാറ്റ്",
    weather: "കാലാവസ്ഥ",
    records: "രേഖകൾ",
    settings: "ക്രമീകരണങ്ങൾ",
    
    // Home page
    heroTitle: "ഡിജിറ്റൽ കൃഷി ഓഫീസർ",
    heroSubtitle: "AI-പവർഡ് കാർഷിക ഉപദേശക സംവിധാനം",
    heroDescription: "ശബ്ദം, ടെക്സ്റ്റ് അല്ലെങ്കിൽ ചിത്ര വിശകലനം വഴി നിങ്ങളുടെ കൃഷി ആവശ്യങ്ങൾക്ക് തൽക്ഷണ വിദഗ്ധ ഉപദേശം നേടുക",
    getStarted: "ആരംഭിക്കുക",
    learnMore: "കൂടുതൽ അറിയുക",
    
    // Features
    aiAdvice: "AI-പവർഡ് ഉപദേശം",
    aiAdviceDesc: "വികസിത AI വഴി പ്രവർത്തിക്കുന്ന ബുദ്ധിപരമായ കൃഷി ശുപാർശകൾ നേടുക",
    voiceInput: "ശബ്ദ തിരിച്ചറിയൽ",
    voiceInputDesc: "നിങ്ങളുടെ ഇഷ്ട ഭാഷയിൽ സംസാരിക്കുക - മലയാളം, ഹിന്ദി അല്ലെങ്കിൽ ഇംഗ്ലീഷ്",
    imageAnalysis: "ചിത്ര വിശകലനം",
    imageAnalysisDesc: "തൽക്ഷണ രോഗ തിരിച്ചറിയലിനായി വിള ചിത്രങ്ങൾ അപ്‌ലോഡ് ചെയ്യുക",
    weatherIntegration: "കാലാവസ്ഥ സംയോജനം",
    weatherIntegrationDesc: "മെച്ചപ്പെട്ട കൃഷി തീരുമാനങ്ങൾക്കായി സ്ഥാന-അടിസ്ഥാന കാലാവസ്ഥാ ഡാറ്റ",
    
    // Chat interface
    typeMessage: "നിങ്ങളുടെ കൃഷി ചോദ്യം ഇവിടെ ടൈപ്പ് ചെയ്യുക...",
    send: "അയയ്ക്കുക",
    listening: "കേൾക്കുന്നു...",
    processing: "നിങ്ങളുടെ ചോദ്യം പ്രോസസ്സ് ചെയ്യുന്നു...",
    uploadImage: "ചിത്രം അപ്‌ലോഡ് ചെയ്യുക",
    
    // Weather
    currentWeather: "നിലവിലെ കാലാവസ്ഥ",
    temperature: "താപനില",
    humidity: "ആർദ്രത",
    windSpeed: "കാറ്റിന്റെ വേഗത",
    
    // Records
    farmingRecords: "കൃഷി രേഖകൾ",
    addRecord: "രേഖ ചേർക്കുക",
    cropName: "വിളയുടെ പേര്",
    plantingDate: "നടീൽ തീയതി",
    expectedHarvest: "പ്രതീക്ഷിക്കുന്ന വിളവെടുപ്പ്",
    notes: "കുറിപ്പുകൾ",
    save: "സേവ് ചെയ്യുക",
    
    // Settings
    language: "ഭാഷ",
    notifications: "അറിയിപ്പുകൾ",
    apiKeys: "API കീകൾ",
    geminiKey: "Gemini API കീ",
    weatherKey: "കാലാവസ്ഥ API കീ",
    
    // Common
    loading: "ലോഡ് ചെയ്യുന്നു...",
    error: "പിശക്",
    success: "വിജയം",
    cancel: "റദ്ദാക്കുക",
    confirm: "സ്ഥിരീകരിക്കുക"
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (langCode) => {
    if (translations[langCode]) {
      setCurrentLanguage(langCode);
      localStorage.setItem('selectedLanguage', langCode);
    }
  };

  const translate = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    translate,
    availableLanguages: [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'हिंदी' },
      { code: 'ml', name: 'മലയാളം' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
