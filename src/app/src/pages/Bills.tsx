import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billsAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Bills.css';

const Bills: React.FC = () => {
  const navigate = useNavigate();
  const [billers, setBillers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'list' | 'form' | 'confirm' | 'success'>('list');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pay' | 'history'>('pay');

  useEffect(() => {
    billsAPI.getBillers().then(r => setBillers(r.data)).catch(() => {});
    billsAPI.getHistory().then(r => setHistory(r.data)).catch(() => {});
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      await billsAPI.payBill({ billerCode: selected.code, accountNumber, amount: parseFloat(amount) });
      setStep('success');
      toast.success('Bill paid successfully!');
      billsAPI.getHistory().then(r => setHistory(r.data)).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    electricity: '#f59e0b', water: '#06b6d4', mobile: '#10b981',
    internet: '#6366f1', insurance: '#8b5cf6', superannuation: '#ec4899'
  };

  return (
    <div className="bills">
      <div className="page-header">
        <button className="back-btn" onClick={() => step === 'list' ? navigate(-1) : setStep('list')}>←</button>
        <span className="page-title">Bill Payments</span>
      </div>

      {step === 'list' && (
        <>
          <div className="tab-bar">
            <button className={activeTab === 'pay' ? 'active' : ''} onClick={() => setActiveTab('pay')}>Pay Bills</button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>History</button>
          </div>

          {activeTab === 'pay' && (
            <div className="bills-content">
              <div className="billers-grid">
                {billers.map(b => (
                  <div
                    key={b.code}
                    className="biller-card"
                    onClick={() => { setSelected(b); setStep('form'); }}
                    style={{ borderTop: `4px solid ${typeColors[b.type] || '#6366f1'}` }}
                  >
                    <div className="biller-icon">{b.icon}</div>
                    <div className="biller-name">{b.name}</div>
                    <div className="biller-type">{b.type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bills-content">
              {history.length === 0 ? (
                <div className="empty-state">No bill payments yet</div>
              ) : history.map(h => (
                <div key={h.id} className="bill-history-item">
                  <div className="bill-hist-info">
                    <span className="bill-hist-name">{h.biller_name}</span>
                    <span className="bill-hist-acc">{h.account_number}</span>
                    <span className="bill-hist-date">{new Date(h.paid_at || h.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="bill-hist-amount">PGK {parseFloat(h.amount).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {step === 'form' && selected && (
        <div className="bills-content">
          <div className="selected-biller">
            <span className="biller-icon-lg">{selected.icon}</span>
            <div>
              <div className="biller-name-lg">{selected.name}</div>
              <div className="biller-type">{selected.type}</div>
            </div>
          </div>
          <div className="form-group">
            <label>Account / Customer Number</label>
            <input
              placeholder="e.g. 1234567890"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Amount (PGK)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => accountNumber && amount ? setStep('confirm') : toast.error('Fill in all fields')}>
            Continue
          </button>
        </div>
      )}

      {step === 'confirm' && selected && (
        <div className="bills-content">
          <div className="confirm-card">
            <h2>Confirm Payment</h2>
            <div className="confirm-row"><span>Biller</span><span>{selected.name}</span></div>
            <div className="confirm-row"><span>Account</span><span>{accountNumber}</span></div>
            <div className="confirm-row big"><span>Amount</span><span>PGK {parseFloat(amount).toFixed(2)}</span></div>
          </div>
          <button className="btn-primary" onClick={handlePay} disabled={loading}>
            {loading ? 'Paying...' : 'Pay Now'}
          </button>
          <button className="btn-ghost" onClick={() => setStep('form')}>Back</button>
        </div>
      )}

      {step === 'success' && (
        <div className="bills-content success-screen">
          <div className="success-icon">✅</div>
          <h2>Payment Successful!</h2>
          <p>{selected?.name} bill paid</p>
          <p>PGK {parseFloat(amount).toFixed(2)}</p>
          <button className="btn-primary" onClick={() => { setStep('list'); setSelected(null); setAmount(''); setAccountNumber(''); }}>
            Pay Another Bill
          </button>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>Go Home</button>
        </div>
      )}
    </div>
  );
};

export default Bills;
