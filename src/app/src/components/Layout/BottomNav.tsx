import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Home' },
  { path: '/transfers', icon: '💸', label: 'Send' },
  { path: '/scan', icon: '📷', label: 'Scan' },
  { path: '/bills', icon: '📄', label: 'Bills' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${item.label === 'Scan' ? 'scan-btn' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
