import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bankAPI, walletAPI } from '../services/api';
import toast from 'react-hot-toast';
import './TopUp.css';

const TopUp: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    bankAPI.getAccounts().then(r => setAccounts(r.data?.accounts || r.data || [])).catch(() => {});
    walletAPI.getBalance().then(r => setBalance(r.data.balance || 0)).catch(() => {});
  }, []);

  const handleTopUp = async () => {
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter a valid amount');
    if (!selected) return toast.error('Select a bank account');
    setLoading(true);
    try {
      await walletAPI.topUp({ accountId: selected.id, amount: parseFloat(amount) });
      toast.success(`PGK ${amount} added to your wallet!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Top up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topup">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Top Up Wallet</span>
      </div>

      <div className="topup-content">
        <div className="balance-mini">
          <span>Current Balance</span>
          <strong>PGK {parseFloat(String(balance)).toFixed(2)}</strong>
        </div>

        <div className="section-label">Select Bank Account</div>
        {accounts.length === 0 ? (
          <div className="no-account-card">
            <p>No bank accounts linked</p>
            <button className="btn-outline" onClick={() => navigate('/banks')}>Link Bank Account</button>
          </div>
        ) : (
          accounts.map(acc => (
            <div
              key={acc.id}
              className={`bank-card ${selected?.id === acc.id ? 'selected' : ''}`}
              onClick={() => setSelected(acc)}
            >
              <div className="bank-icon">🏦</div>
              <div>
                <div className="bank-name">{acc.bank_code?.toUpperCase() || acc.bankCode}</div>
                <div className="bank-account">****{(acc.account_number || acc.accountNumber)?.slice(-4)}</div>
              </div>
              {selected?.id === acc.id && <span className="selected-check">✅</span>}
            </div>
          ))
        )}

        <div className="section-label">Enter Amount</div>
        <div className="amount-input-wrap">
          <span className="currency-label">PGK</span>
          <input
            type="number"
            className="amount-input"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className="quick-amounts">
          {[50, 100, 200, 500, 1000].map(a => (
            <button key={a} className="quick-amt-btn" onClick={() => setAmount(String(a))}>PGK {a}</button>
          ))}
        </div>

        <button className="btn-primary" onClick={handleTopUp} disabled={loading || !accounts.length}>
          {loading ? 'Processing...' : 'Add Money'}
        </button>
      </div>
    </div>
  );
};

export default TopUp;
