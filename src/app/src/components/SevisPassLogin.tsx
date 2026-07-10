import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SevisPassLoginProps {
  redirectTo?: string;
}

const SevisPassLogin: React.FC<SevisPassLoginProps> = ({ redirectTo = '/dashboard' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're returning from SevisPass OAuth callback
    const token = searchParams.get('token');
    const sevispassAuth = searchParams.get('sevispass');
    const callbackError = searchParams.get('error');

    if (callbackError) {
      setError(decodeURIComponent(callbackError));
      return;
    }

    if (token && sevispassAuth === 'true') {
      // Save token and redirect
      localStorage.setItem('token', token);
      window.location.href = redirectTo;
    }
  }, [searchParams, redirectTo]);

  const handleSevisPassLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the SevisPass login URL from backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/sevispass/login`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to initiate SevisPass login');
        return;
      }

      // Redirect to SevisPass login
      window.location.href = data.loginUrl;
    } catch (err) {
      setError('Failed to initiate SevisPass login');
      console.error('SevisPass login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    navigate(redirectTo);
    return null;
  }

  return (
    <div className="sevispass-login">
      <div className="sevispass-login-container">
        <h2>Login with SevisPass</h2>
        <p>Use your Papua New Guinea digital ID to login securely</p>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <button
          className="btn btn-sevispass"
          onClick={handleSevisPassLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Redirecting to SevisPass...' : 'Login with SevisPass'}
        </button>

        <div className="security-info">
          <p>🔒 Your SevisPass data is protected and never stored on our servers</p>
        </div>
      </div>
    </div>
  );
};

export default SevisPassLogin;
