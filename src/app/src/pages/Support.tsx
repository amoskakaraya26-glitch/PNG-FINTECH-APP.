import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { disputeAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Support.css';

const faqs = [
  { q: 'How do I send money?', a: 'Go to Send Money, enter the recipient\'s phone number, amount, and confirm with your PIN.' },
  { q: 'How do I top up my wallet?', a: 'Go to Top Up, select your linked bank account, enter amount and confirm.' },
  { q: 'What are the transaction limits?', a: 'Unverified: PGK 500/tx. After KYC Level 1: PGK 5,000/day. Go to Profile > KYC to verify.' },
  { q: 'How do I verify my identity (KYC)?', a: 'Go to Profile > KYC Verification. You\'ll need a valid ID (passport, driver\'s license) and selfie.' },
  { q: 'Are transfers free?', a: 'P2P transfers within PNG Wallet are free. Bank withdrawals have a 0.5% fee.' },
  { q: 'How do I pay bills?', a: 'Go to Bills, select the biller (PNG Power, Digicel, etc.), enter your account number and amount.' },
];

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'faq' | 'dispute' | 'tickets'>('faq');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [form, setForm] = useState({ type: 'transaction', subject: '', description: '', transactionId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'tickets') {
      disputeAPI.getAll().then(r => setDisputes(r.data)).catch(() => {});
    }
  }, [activeTab]);

  const handleSubmit = async () => {
    if (!form.subject || !form.description) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      await disputeAPI.create(form);
      toast.success('Dispute submitted! We\'ll review it within 24 hours.');
      setForm({ type: 'transaction', subject: '', description: '', transactionId: '' });
      setActiveTab('tickets');
      disputeAPI.getAll().then(r => setDisputes(r.data)).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="support">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Help &amp; Support</span>
      </div>

      <div className="tab-bar">
        <button className={activeTab === 'faq' ? 'active' : ''} onClick={() => setActiveTab('faq')}>FAQ</button>
        <button className={activeTab === 'dispute' ? 'active' : ''} onClick={() => setActiveTab('dispute')}>Raise Issue</button>
        <button className={activeTab === 'tickets' ? 'active' : ''} onClick={() => setActiveTab('tickets')}>My Tickets</button>
      </div>

      <div className="support-content">
        {activeTab === 'faq' && (
          <>
            <div className="contact-info">
              <div className="contact-item">📞 <span>Hotline: 1800-PNG-WALLET</span></div>
              <div className="contact-item">📧 <span>support@pngwallet.pg</span></div>
              <div className="contact-item">⏰ <span>Mon-Fri, 8am - 6pm</span></div>
            </div>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span>{openFaq === i ? '▲' : '▼'}</span>
                </div>
                {openFaq === i && <div className="faq-a">{faq.a}</div>}
              </div>
            ))}
          </>
        )}

        {activeTab === 'dispute' && (
          <div className="dispute-form">
            <h3>Submit a Dispute</h3>
            <div className="form-group">
              <label>Issue Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="transaction">Transaction Issue</option>
                <option value="account">Account Problem</option>
                <option value="billing">Billing Error</option>
                <option value="fraud">Fraudulent Activity</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Transaction ID (optional)</label>
              <input placeholder="e.g. tx_abc123" value={form.transactionId} onChange={e => setForm({...form, transactionId: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input placeholder="Brief description of the issue" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Please provide details about the issue..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows={5}
              />
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            {disputes.length === 0 ? (
              <div className="empty-state">No support tickets yet</div>
            ) : disputes.map(d => (
              <div key={d.id} className="ticket-item">
                <div className="ticket-header">
                  <span className="ticket-subject">{d.subject}</span>
                  <span className={`ticket-status ${d.status}`}>{d.status}</span>
                </div>
                <div className="ticket-type">{d.type}</div>
                <div className="ticket-date">{new Date(d.created_at).toLocaleDateString()}</div>
                {d.resolution && <div className="ticket-resolution">✅ {d.resolution}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
