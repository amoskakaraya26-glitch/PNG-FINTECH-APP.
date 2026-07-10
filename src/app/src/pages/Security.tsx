import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Security.css';

const Security: React.FC = () => {
  const navigate = useNavigate();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleChangePin = async () => {
    if (newPin !== confirmPin) return toast.error('New PINs do not match');
    if (newPin.length < 4) return toast.error('PIN must be at least 4 digits');
    setLoading(true);
    try {
      await authAPI.changePin({ currentPin, newPin });
      toast.success('PIN changed successfully!');
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
      setActiveSection(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change PIN');
    } finally { setLoading(false); }
  };

  const securityItems = [
    {
      id: 'pin',
      icon: '🔑',
      title: 'Change PIN',
      desc: 'Update your wallet PIN',
    },
    {
      id: 'biometric',
      icon: '👆',
      title: 'Biometric Login',
      desc: 'Use fingerprint or face ID',
      toggle: true,
    },
    {
      id: '2fa',
      icon: '🛡️',
      title: 'Two-Factor Authentication',
      desc: 'Extra security for your account',
      toggle: true,
    },
  ];

  const limits = [
    { label: 'Per Transaction', value: 'PGK 500', level: 'Unverified' },
    { label: 'Daily Send Limit', value: 'PGK 1,000', level: 'Unverified' },
    { label: 'Monthly Send Limit', value: 'PGK 10,000', level: 'Unverified' },
    { label: 'After KYC Level 1', value: 'PGK 5,000/day', level: 'KYC Level 1' },
  ];

  return (
    <div className="security">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Security &amp; Limits</span>
      </div>

      <div className="security-content">
        <div className="security-section">
          <h3>Security Settings</h3>
          {securityItems.map(item => (
            <div key={item.id}>
              <div className="security-item" onClick={() => setActiveSection(activeSection === item.id ? null : item.id)}>
                <span className="sec-icon">{item.icon}</span>
                <div className="sec-info">
                  <div className="sec-title">{item.title}</div>
                  <div className="sec-desc">{item.desc}</div>
                </div>
                {item.toggle ? (
                  <div className="toggle-switch off">
                    <div className="toggle-knob" />
                  </div>
                ) : (
                  <span className="sec-arrow">{activeSection === item.id ? '▲' : '›'}</span>
                )}
              </div>

              {activeSection === 'pin' && item.id === 'pin' && (
                <div className="pin-form">
                  <div className="form-group">
                    <label>Current PIN</label>
                    <input type="password" placeholder="Current PIN" value={currentPin} onChange={e => setCurrentPin(e.target.value)} maxLength={6} />
                  </div>
                  <div className="form-group">
                    <label>New PIN</label>
                    <input type="password" placeholder="New PIN (4-6 digits)" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={6} />
                  </div>
                  <div className="form-group">
                    <label>Confirm New PIN</label>
                    <input type="password" placeholder="Confirm new PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={6} />
                  </div>
                  <button className="btn-primary" onClick={handleChangePin} disabled={loading}>
                    {loading ? 'Updating...' : 'Update PIN'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="security-section">
          <h3>Account Limits</h3>
          <p className="limits-note">Complete KYC verification to unlock higher limits</p>
          {limits.map((l, i) => (
            <div key={i} className="limit-row">
              <div>
                <div className="limit-label">{l.label}</div>
                <div className="limit-level">{l.level}</div>
              </div>
              <div className="limit-value">{l.value}</div>
            </div>
          ))}
          <button className="btn-kyc" onClick={() => navigate('/kyc')}>
            🆔 Complete KYC to unlock higher limits →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Security;
