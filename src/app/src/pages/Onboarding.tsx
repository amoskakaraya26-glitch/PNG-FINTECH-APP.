import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Onboarding.css';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ phone: '', fullName: '', pin: '', confirmPin: '', referralCode: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (form.pin !== form.confirmPin) return toast.error('PINs do not match');
    if (form.pin.length < 4) return toast.error('PIN must be at least 4 digits');
    setLoading(true);
    try {
      const res = await authAPI.register({
        phone: form.phone,
        fullName: form.fullName,
        pin: form.pin,
        referralCode: form.referralCode || undefined
      });
      await login(form.phone, form.pin);
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    try { await authAPI.completeOnboarding(); } catch {}
    navigate('/dashboard');
  };

  const steps = ['welcome', 'register', 'pin', 'done'];

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        {step === 0 && (
          <div className="ob-step">
            <div className="ob-emoji">🇵🇬</div>
            <h1>Welcome to PNG Wallet</h1>
            <p>The fastest, easiest way to manage your money in Papua New Guinea.</p>
            <ul className="ob-features">
              <li>✅ Send money instantly</li>
              <li>✅ Pay bills &amp; utilities</li>
              <li>✅ Bank-grade security</li>
              <li>✅ Free to sign up</li>
            </ul>
            <button className="btn-primary" onClick={() => setStep(1)}>Get Started →</button>
            <p className="ob-signin">Already have an account? <span onClick={() => navigate('/login')}>Sign In</span></p>
          </div>
        )}

        {step === 1 && (
          <div className="ob-step">
            <h2>Create Your Account</h2>
            <p>Enter your details to get started</p>
            <div className="ob-form">
              <input
                placeholder="Full Name"
                value={form.fullName}
                onChange={e => setForm({...form, fullName: e.target.value})}
              />
              <input
                placeholder="Phone Number (e.g. 70000000)"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                type="tel"
              />
              <input
                placeholder="Referral Code (optional)"
                value={form.referralCode}
                onChange={e => setForm({...form, referralCode: e.target.value})}
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => form.fullName && form.phone ? setStep(2) : toast.error('Fill in all fields')}
            >
              Next →
            </button>
            <button className="btn-back" onClick={() => setStep(0)}>← Back</button>
          </div>
        )}

        {step === 2 && (
          <div className="ob-step">
            <h2>Set Your PIN</h2>
            <p>Choose a 4-6 digit PIN to secure your wallet</p>
            <div className="ob-form">
              <input
                placeholder="Enter PIN"
                value={form.pin}
                onChange={e => setForm({...form, pin: e.target.value})}
                type="password"
                maxLength={6}
              />
              <input
                placeholder="Confirm PIN"
                value={form.confirmPin}
                onChange={e => setForm({...form, confirmPin: e.target.value})}
                type="password"
                maxLength={6}
              />
            </div>
            <button className="btn-primary" onClick={handleRegister} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="ob-step">
            <div className="ob-emoji">🎉</div>
            <h2>You're all set!</h2>
            <p>Your PNG Wallet is ready. Verify your identity to unlock higher limits.</p>
            <button className="btn-primary" onClick={() => navigate('/kyc')}>Verify Identity (Recommended)</button>
            <button className="btn-ghost" onClick={finish}>Skip for now</button>
          </div>
        )}

        <div className="ob-dots">
          {steps.map((_, i) => <div key={i} className={`ob-dot ${i === step ? 'active' : ''}`} />)}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
