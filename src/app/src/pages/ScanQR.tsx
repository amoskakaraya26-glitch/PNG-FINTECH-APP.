import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import './ScanQR.css';

const ScanQR: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');

  const handleManualPay = () => {
  if (!manualCode.trim()) {
    return toast.error('Enter QR code or payment details');
  }

  try {
    const qr = JSON.parse(manualCode);

if (qr.type !== "png_wallet_receive") {
  return toast.error("Unsupported QR code");
}

toast.success(`QR detected for ${qr.name}`);
navigate("/send", {
  state: {
    recipientPhone: qr.phone,
    recipientName: qr.name,
  },
});
  } catch {
    toast.error('Invalid QR code');
  }
};

  return (
    <div className="scan-qr">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Scan QR Code</span>
      </div>

      <div className="mode-tabs">
        <button className={mode === 'scan' ? 'active' : ''} onClick={() => setMode('scan')}>Scan QR</button>
        <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>Manual Entry</button>
      </div>

      {mode === 'scan' && (
        <div className="scan-view">
          <div className="scanner-frame">
            <div className="scanner-overlay">
              <div className="scan-corner tl" />
              <div className="scan-corner tr" />
              <div className="scan-corner bl" />
              <div className="scan-corner br" />
              <div className="scan-line" />
            </div>
            <div className="scanner-placeholder">
              <span className="camera-icon">📷</span>
              <p>Camera permission required</p>
              <p className="scan-hint">Point camera at a QR code to pay</p>
            </div>
          </div>
          <p className="scan-label">Align QR code within the frame</p>
          <button className="btn-secondary" onClick={() => setMode('manual')}>
            Enter code manually instead
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <div className="manual-view">
          <div className="manual-icon">🔳</div>
          <h3>Enter Payment Code</h3>
          <p>Enter the merchant's QR code or payment reference</p>
          <textarea
            className="code-input"
            placeholder="Paste QR code data or payment reference here..."
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            rows={4}
          />
          <button className="btn-primary" onClick={handleManualPay}>Pay Now</button>
          <div className="or-divider"><span>OR</span></div>
          <button className="btn-outline" onClick={() => navigate('/merchant')}>Browse Merchants</button>
        </div>
      )}
    </div>
  );
};

export default ScanQR;
