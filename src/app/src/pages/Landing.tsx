import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const features = [
    { icon: '💸', title: 'Instant Transfers', desc: 'Send money to anyone in PNG instantly' },
    { icon: '🏦', title: 'Bank Integration', desc: 'Link BSP, Kina Bank & more' },
    { icon: '📱', title: 'Bill Payments', desc: 'Pay electricity, water, mobile top-up' },
    { icon: '🔒', title: 'Bank-Grade Security', desc: 'PIN + biometric protection' },
    { icon: '📊', title: 'Spending Analytics', desc: 'Track where your money goes' },
    { icon: '🎁', title: 'Referral Rewards', desc: 'Earn PGK 5 for every friend you invite' },
  ];

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo">🇵🇬 PNG Wallet</div>
        <div className="landing-nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🇵🇬 Made for Papua New Guinea</div>
          <h1>The Smart Wallet for PNG</h1>
          <p>Send money, pay bills, and manage your finances with ease. Join thousands of Papua New Guineans who trust PNG Wallet.</p>
          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={() => navigate('/register')}>Create Free Account</button>
            <button className="btn-outline btn-large" onClick={() => navigate('/login')}>Sign In</button>
          </div>
          <div className="hero-stats">
            <div className="stat"><strong>50K+</strong><span>Users</span></div>
            <div className="stat"><strong>PGK 2M+</strong><span>Transferred</span></div>
            <div className="stat"><strong>99.9%</strong><span>Uptime</span></div>
          </div>
        </div>
        <div className="hero-phone">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="mock-balance">PGK 1,250.00</div>
              <div className="mock-label">Available Balance</div>
              <div className="mock-actions">
                <div className="mock-btn">💸 Send</div>
                <div className="mock-btn">⬇️ Top Up</div>
                <div className="mock-btn">📄 Bills</div>
              </div>
              <div className="mock-txns">
                <div className="mock-tx">💸 Sent to John <span>-PGK 50</span></div>
                <div className="mock-tx">⬆️ PNG Power <span>-PGK 120</span></div>
                <div className="mock-tx">⬇️ Top Up <span>+PGK 500</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Everything you need</h2>
        <p>One app for all your financial needs</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to get started?</h2>
        <p>Join PNG Wallet today and take control of your money</p>
        <button className="btn-primary btn-large" onClick={() => navigate('/register')}>Create Free Account →</button>
      </section>

      <footer className="landing-footer">
        <div>© 2024 PNG Wallet. All rights reserved.</div>
        <div className="footer-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Contact Us</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
