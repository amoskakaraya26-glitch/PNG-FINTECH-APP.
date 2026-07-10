import React, { useState } from 'react';
import { Alert, AlertDescription } from '../components/ui/alert';

interface TwoFASetupProps {
  onSuccess?: () => void;
}

export const TwoFASetup: React.FC<TwoFASetupProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'method-select' | 'totp-setup' | 'verify' | 'complete'>('method-select');
  const [method, setMethod] = useState<'sms' | 'email' | 'totp'>('totp');
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSetupTOTP = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/2fa/setup/totp', { method: 'POST' });
      const data = await response.json();

      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep('totp-setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'totp',
          token,
          backupCodes,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      setStep('complete');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Set Up Two-Factor Authentication</h2>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {step === 'method-select' && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">Choose your preferred 2FA method:</p>

          <button
            onClick={() => {
              setMethod('totp');
              handleSetupTOTP();
            }}
            disabled={loading}
            className="w-full p-4 border-2 rounded-lg hover:bg-blue-50 transition"
          >
            <div className="text-lg font-semibold">Authenticator App</div>
            <div className="text-sm text-gray-600">Most secure - use Google Authenticator or Authy</div>
          </button>

          <button
            onClick={() => setMethod('sms')}
            className="w-full p-4 border-2 rounded-lg hover:bg-blue-50 transition"
          >
            <div className="text-lg font-semibold">SMS</div>
            <div className="text-sm text-gray-600">Receive OTP codes via SMS</div>
          </button>

          <button
            onClick={() => setMethod('email')}
            className="w-full p-4 border-2 rounded-lg hover:bg-blue-50 transition"
          >
            <div className="text-lg font-semibold">Email</div>
            <div className="text-sm text-gray-600">Receive OTP codes via email</div>
          </button>
        </div>
      )}

      {step === 'totp-setup' && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-6 rounded-lg flex justify-center">
            {qrCode && <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />}
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <p className="font-semibold mb-2">Important: Save your backup codes</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((code, i) => (
                <code key={i} className="bg-white p-2 text-center font-mono text-sm">
                  {code}
                </code>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Keep these codes safe. You can use them to access your account if you lose your phone.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Enter code from authenticator app:</label>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
            />
          </div>

          <button
            onClick={handleVerifyToken}
            disabled={loading || token.length !== 6}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
          </button>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center space-y-4">
          <div className="text-5xl">✓</div>
          <h3 className="text-xl font-bold text-green-600">Two-Factor Authentication Enabled!</h3>
          <p className="text-gray-600">Your account is now more secure. You'll be asked for a code when logging in.</p>

          <button
            onClick={() => window.location.href = '/settings'}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFASetup;
