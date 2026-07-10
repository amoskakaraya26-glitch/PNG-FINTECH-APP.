import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { merchantAPI } from '../services/api';
import toast from 'react-hot-toast';
import './MerchantPayment.css';

const MerchantPayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'search' | 'amount' | 'confirm' | 'success'>('search');
  const [query, setQuery] = useState('');
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');
    if (phone && name) {
      setSelected({ phone, business_name: name });
      setStep('amount');
    }
  }, []);

  const searchMerchants = async () => {
    if (!query.trim()) return;
    try {
      const res = await merchantAPI.search(query);
      setMerchants(res.data);
      if (res.data.length === 0) toast.error('No merchants found');
    } catch { toast.error('Search failed'); }
  };

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter valid amount');
    setLoading(true);
    try {
      await merchantAPI.pay({ merchantPhone: selected.phone, amount: parseFloat(amount), note });
      setStep('success');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="merchant-payment">
      <div className="page-header">
        <button className="back-btn" onClick={() => step === 'search' ? navigate(-1) : setStep('search')}>←</button>
        <span className="page-title">
          {step === 'search' ? 'Merchant Payment' : step === 'amount' ? 'Enter Amount' : step === 'confirm' ? 'Confirm Payment' : 'Payment Sent'}
        </span>
      </div>

      {step === 'search' && (
        <div className="search-content">
          <div className="search-box">
            <input
              placeholder="Search merchant name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchMerchants()}
            />
            <button onClick={searchMerchants}>🔍</button>
          </div>

          {merchants.map(m => (
            <div key={m.id} className="merchant-item" onClick={() => { setSelected(m); setStep('amount'); }}>
              <div className="merchant-icon">🏪</div>
              <div className="merchant-info">
                <div className="merchant-name">{m.business_name}</div>
                <div className="merchant-category">{m.category || 'Business'}</div>
              </div>
              <span>›</span>
            </div>
          ))}

          {merchants.length === 0 && query && (
            <div className="no-results">Try searching for a merchant name</div>
          )}

          <div className="manual-section">
            <p>Or enter merchant phone number manually:</p>
            <div className="manual-input">
              <input
                placeholder="+675 XXXX XXXX"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button onClick={() => { setSelected({ phone: query, business_name: query }); setStep('amount'); }}>
                Use
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'amount' && selected && (
        <div className="amount-content">
          <div className="merchant-selected">
            <div className="merchant-big-icon">🏪</div>
            <h3>{selected.business_name}</h3>
            <p>{selected.phone}</p>
          </div>
          <div className="amount-input-wrap">
            <span className="currency">PGK</span>
            <input
              className="amount-big"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className="quick-amounts">
            {[10, 20, 50, 100, 200, 500].map(a => (
              <button key={a} onClick={() => setAmount(String(a))}>PGK {a}</button>
            ))}
          </div>
          <div className="note-input">
            <input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => amount && setStep('confirm')}>
            Continue
          </button>
        </div>
      )}

      {step === 'confirm' && selected && (
        <div className="confirm-content">
          <div className="confirm-card">
            <h3>Confirm Payment</h3>
            <div className="confirm-row">
              <span>To</span><strong>{selected.business_name}</strong>
            </div>
            <div className="confirm-row">
              <span>Phone</span><strong>{selected.phone}</strong>
            </div>
            <div className="confirm-row">
              <span>Amount</span><strong className="amount-large">PGK {parseFloat(amount).toFixed(2)}</strong>
            </div>
            {note && <div className="confirm-row"><span>Note</span><strong>{note}</strong></div>}
          </div>
          <button className="btn-primary" onClick={handlePay} disabled={loading}>
            {loading ? 'Processing...' : `Pay PGK ${parseFloat(amount).toFixed(2)}`}
          </button>
          <button className="btn-cancel" onClick={() => setStep('amount')}>Cancel</button>
        </div>
      )}

      {step === 'success' && (
        <div className="success-content">
          <div className="success-icon">✅</div>
          <h2>Payment Successful!</h2>
          <p>PGK {parseFloat(amount).toFixed(2)} paid to</p>
          <p><strong>{selected?.business_name}</strong></p>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
          <button className="btn-outline" onClick={() => { setStep('search'); setAmount(''); setSelected(null); }}>
            Make Another Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default MerchantPayment;
