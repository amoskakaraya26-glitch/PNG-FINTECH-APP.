import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    pin: '',
    confirmPin: '',
    referralCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName || !form.phone || !form.pin) {
      toast.error('Please complete all required fields.');
      return;
    }

    if (form.pin !== form.confirmPin) {
      toast.error('PINs do not match.');
      return;
    }

    if (form.pin.length < 4) {
      toast.error('PIN must be at least 4 digits.');
      return;
    }

    try {
      setLoading(true);

      const response = await authAPI.register({
        fullName: form.fullName,
        phone: form.phone,
        pin: form.pin,
        referralCode: form.referralCode || undefined,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user?.id || '');

      toast.success('Account created successfully!');

      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>🇵🇬 PNG Wallet</h1>
        <p>Create your free account</p>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="pin"
            placeholder="Create PIN"
            value={form.pin}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPin"
            placeholder="Confirm PIN"
            value={form.confirmPin}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="referralCode"
            placeholder="Referral Code (Optional)"
            value={form.referralCode}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-link">
          Already have an account?{' '}
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;