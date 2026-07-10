import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import FacialRecognition from '../components/FacialRecognition';
import './Login.css';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [sevisPassLoading, setSevisPassLoading] = useState(false);
  const [showFacialLogin, setShowFacialLogin] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, pin);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceSuccess = (token?: string) => {
    if (!token) {
      toast.error('Face login token missing');
      return;
    }

    localStorage.setItem('token', token);
    toast.success('Face login successful!');
    window.location.href = '/dashboard';
  };

  const handleSevisPassLogin = async () => {
    try {
      setSevisPassLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || (window.location.port === '3001' ? 'http://localhost:3000' : '');
      const response = await fetch(`${apiBase}/api/auth/sevispass/login`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const body = await response.text();
        throw new Error(`Invalid response from server (${response.status}). ${body.slice(0, 80)}`);
      }
      const data = await response.json();

      if (!response.ok || !data.success || !data.loginUrl) {
        throw new Error(data.error || 'Failed to initiate SevisPass login');
      }

      window.location.href = data.loginUrl;
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate SevisPass login');
    } finally {
      setSevisPassLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {showFacialLogin ? (
          <>
            <button 
              className="btn-back"
              onClick={() => setShowFacialLogin(false)}
              style={{ marginBottom: '20px', padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              ← Back to PIN Login
            </button>
            <div className="form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="70000000"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label>PIN (first-time face setup only)</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter PIN for initial enrollment"
                maxLength={6}
              />
            </div>
            <FacialRecognition
              mode="login"
              phone={phone}
              pin={pin}
              onSuccess={handleFaceSuccess}
              onError={(message) => toast.error(message)}
            />
          </>
        ) : (
          <>
            <div className="login-logo">🇵🇬</div>
            <h1>PNG Wallet</h1>
            <p>Sign in to your wallet</p>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="70000000"
                  required
                />
              </div>
              <div className="form-group">
                <label>PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>or</p>
              <button
                type="button"
                onClick={handleSevisPassLogin}
                disabled={sevisPassLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f3f8c',
                  border: '2px solid #0f3f8c',
                  borderRadius: '8px',
                  cursor: sevisPassLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#fff',
                  opacity: sevisPassLoading ? 0.7 : 1,
                  marginBottom: '10px',
                }}
              >
                {sevisPassLoading ? 'Redirecting...' : '🛂 Continue with SevisPass'}
              </button>
              <button
                type="button"
                onClick={() => setShowFacialLogin(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f0f0f0',
                  border: '2px solid #007AFF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#007AFF',
                }}
              >
                📸 Login with Face
              </button>
            </div>
            <p className="login-register">
              Don't have an account? <span onClick={() => navigate('/register')}>Create one</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
