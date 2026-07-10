import React from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProfileQR.css';

const ProfileQR: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const phone = (user as any)?.phone || '';
  const name = user?.full_name || user?.fullName || 'User';

  const qrValue = JSON.stringify({ type: 'png_wallet_receive', phone, name });

  const handleShare = async () => {
    const shareText = `Send me money on PNG Wallet!\nPhone: ${phone}\nName: ${name}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PNG Wallet QR', text: shareText });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText).then(() => toast.success('Link copied!'));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(phone).then(() => toast.success('Phone number copied!'));
  };

  return (
    <div className="profile-qr">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">My QR Code</span>
      </div>

      <div className="qr-content">
        <div className="qr-card">
          <div className="qr-header">
            <div className="qr-avatar">{name[0]?.toUpperCase()}</div>
            <h2>{name}</h2>
            <p>{phone}</p>
          </div>

          <div className="qr-code-wrap">
            <QRCode
              value={qrValue}
              size={220}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox="0 0 220 220"
            />
          </div>

          <p className="qr-hint">Scan this code to send money to me</p>

          <div className="qr-actions">
            <button className="btn-primary" onClick={handleShare}>
              📤 Share QR Code
            </button>
            <button className="btn-outline" onClick={handleCopy}>
              📋 Copy Phone Number
            </button>
          </div>
        </div>

        <div className="qr-info-card">
          <div className="qr-info-row">
            <span>📱 Phone</span>
            <strong>{phone}</strong>
          </div>
          <div className="qr-info-row">
            <span>💳 Wallet</span>
            <strong>PNG Wallet</strong>
          </div>
          <div className="qr-info-row">
            <span>💱 Currency</span>
            <strong>PGK</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileQR;
