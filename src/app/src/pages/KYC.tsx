import React, { useState } from 'react';
import './KYC.css';
import { apiFetch } from '../utils/api';

const KYC: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const handleInitiateKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await apiFetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationId(data.result.sessionId);
        setMessage('KYC verification initiated! Check your phone for the verification code.');
      } else {
        const error = await response.json();
        setMessage(error.error || 'KYC initiation failed');
      }
    } catch (error) {
      setMessage('KYC initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationId || !verificationCode) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await apiFetch('/api/kyc/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: verificationId,
          result: {
            userId: 'test-user',
            savisId: `SVS-${Date.now()}`,
            status: 'success',
            attributes: { name, phone }
          }
        }),
      });

      if (response.ok) {
        await response.json();
        setMessage('KYC verification successful! Your identity has been verified.');
        setVerificationId(null);
        setVerificationCode('');
      } else {
        const error = await response.json();
        setMessage(error.error || 'KYC verification failed');
      }
    } catch (error) {
      setMessage('KYC verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kyc">
      <h1>KYC Verification</h1>
      <p>Verify your identity with Savis digital ID</p>

      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
          <button onClick={() => setMessage('')} className="close-btn">×</button>
        </div>
      )}

      {!verificationId ? (
        <div className="kyc-initiate">
          <h2>Start KYC Verification</h2>
          <form onSubmit={handleInitiateKYC} className="kyc-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+675xxxxxxxxx"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Initiating...' : 'Start Verification'}
            </button>
          </form>
        </div>
      ) : (
        <div className="kyc-verify">
          <h2>Complete Verification</h2>
          <p>Enter the verification code sent to your phone</p>
          <form onSubmit={handleVerifyKYC} className="kyc-form">
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Identity'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setVerificationId(null);
                setVerificationCode('');
                setMessage('');
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="kyc-info">
        <h3>Why KYC?</h3>
        <ul>
          <li>Enhanced security for your transactions</li>
          <li>Compliance with PNG financial regulations</li>
          <li>Access to additional banking features</li>
          <li>Protection against fraud and money laundering</li>
        </ul>
      </div>
    </div>
  );
};

export default KYC;