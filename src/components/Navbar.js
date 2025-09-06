import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Navbar = ({ activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { translate } = useLanguage();

  const navItems = [
    { id: 'home', icon: 'fas fa-home', label: translate('home') },
    { id: 'chat', icon: 'fas fa-comments', label: translate('chat') },
    { id: 'weather', icon: 'fas fa-cloud-sun', label: translate('weather') },
    { id: 'market', icon: 'fas fa-chart-line', label: translate('market') },
    { id: 'records', icon: 'fas fa-clipboard-list', label: translate('records') },
    { id: 'settings', icon: 'fas fa-cog', label: translate('settings') }
  ];

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <i className="fas fa-seedling"></i>
        {translate('appTitle')}
      </div>

      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      <ul className={`navbar-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <li key={item.id} className="nav-item">
            <button
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              <i className={item.icon}></i>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
