import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/" className="logo-link">
            🇵🇬 PNG Fintech Wallet
          </Link>
        </div>
        <nav className="nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/wallet"
            className={`nav-link ${location.pathname === '/wallet' ? 'active' : ''}`}
          >
            Wallet
          </Link>
          <Link
            to="/kyc"
            className={`nav-link ${location.pathname === '/kyc' ? 'active' : ''}`}
          >
            KYC
          </Link>
          <Link
            to="/banks"
            className={`nav-link ${location.pathname === '/banks' ? 'active' : ''}`}
          >
            Banks
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;