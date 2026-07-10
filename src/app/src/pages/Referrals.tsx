import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Referrals.css';

const Referrals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>({ referralCode: '', referrals: [], stats: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    referralAPI.getInfo()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleShare = () => {
    const code = data.referralCode || (user as any)?.referral_code;
    const text = `Join PNG Wallet and get PGK 5 bonus! Use my referral code: ${code}\nDownload: https://pngwallet.pg`;
    if (navigator.share) {
      navigator.share({ title: 'Join PNG Wallet', text });
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success('Referral message copied!'));
    }
  };

  const handleCopyCode = () => {
    const code = data.referralCode || (user as any)?.referral_code;
    navigator.clipboard.writeText(code).then(() => toast.success('Code copied!'));
  };

  const code = data.referralCode || (user as any)?.referral_code || 'Loading...';

  return (
    <div className="referrals">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Referral Program</span>
      </div>

      <div className="referrals-content">
        <div className="referral-hero">
          <div className="gift-icon">🎁</div>
          <h2>Earn PGK 5 per referral!</h2>
          <p>Invite friends to PNG Wallet and earn when they sign up and complete their first transaction.</p>
        </div>

        <div className="referral-code-card">
          <span className="code-label">Your Referral Code</span>
          <div className="code-display">{code}</div>
          <div className="code-actions">
            <button className="btn-copy" onClick={handleCopyCode}>📋 Copy Code</button>
            <button className="btn-share" onClick={handleShare}>📤 Share</button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <strong>{data.stats?.total || 0}</strong>
            <span>Total Referrals</span>
          </div>
          <div className="stat-box">
            <strong>{data.stats?.paid_count || 0}</strong>
            <span>Paid</span>
          </div>
          <div className="stat-box">
            <strong>PGK {parseFloat(data.stats?.total_earned || 0).toFixed(2)}</strong>
            <span>Total Earned</span>
          </div>
        </div>

        <div className="how-it-works">
          <h3>How it works</h3>
          {[
            { step: '1', text: 'Share your referral code with friends' },
            { step: '2', text: 'Friend signs up using your code' },
            { step: '3', text: 'Friend completes first transaction' },
            { step: '4', text: 'You both earn PGK 5 bonus!' },
          ].map(s => (
            <div key={s.step} className="step-row">
              <div className="step-number">{s.step}</div>
              <span>{s.text}</span>
            </div>
          ))}
        </div>

        {data.referrals?.length > 0 && (
          <div className="referrals-list">
            <h3>Your Referrals</h3>
            {data.referrals.map((r: any) => (
              <div key={r.id} className="referral-item">
                <div className="ref-avatar">{r.full_name?.[0]}</div>
                <div className="ref-info">
                  <div className="ref-name">{r.full_name}</div>
                  <div className="ref-date">Joined {new Date(r.joined_at).toLocaleDateString()}</div>
                </div>
                <span className={`ref-status ${r.status}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Referrals;
