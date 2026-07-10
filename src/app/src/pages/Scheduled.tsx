import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduledAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Scheduled.css';

const Scheduled: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    recipientPhone: '', amount: '', frequency: 'monthly',
    startDate: '', endDate: '', description: ''
  });

  const load = () => {
    setLoading(true);
    scheduledAPI.getAll().then(r => setPayments(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!form.recipientPhone || !form.amount || !form.startDate) return toast.error('Fill in required fields');
    try {
      await scheduledAPI.create(form);
      toast.success('Scheduled payment created!');
      setShowForm(false);
      setForm({ recipientPhone: '', amount: '', frequency: 'monthly', startDate: '', endDate: '', description: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this scheduled payment?')) return;
    try {
      await scheduledAPI.cancel(id);
      toast.success('Scheduled payment cancelled');
      load();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const freqLabels: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

  return (
    <div className="scheduled">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Scheduled Payments</span>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>+</button>
      </div>

      {showForm && (
        <div className="schedule-form-card">
          <h3>New Scheduled Payment</h3>
          <div className="form-group">
            <label>Recipient Phone *</label>
            <input placeholder="+675 7XXX XXXX" value={form.recipientPhone} onChange={e => setForm({...form, recipientPhone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Amount (PGK) *</label>
            <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input placeholder="e.g. Monthly rent" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-btns">
            <button className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate}>Create</button>
          </div>
        </div>
      )}

      <div className="scheduled-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⏰</div>
            <h3>No Scheduled Payments</h3>
            <p>Set up recurring payments so you never miss them</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>Create First Schedule</button>
          </div>
        ) : payments.map(p => (
          <div key={p.id} className="schedule-card">
            <div className="schedule-header">
              <div className="schedule-freq">{freqLabels[p.frequency] || p.frequency}</div>
              <span className={`schedule-status ${p.status}`}>{p.status}</span>
            </div>
            <div className="schedule-amount">PGK {parseFloat(p.amount).toFixed(2)}</div>
            <div className="schedule-to">To: {p.recipient_phone || p.recipientPhone}</div>
            {p.description && <div className="schedule-desc">{p.description}</div>}
            <div className="schedule-dates">
              <span>Start: {new Date(p.start_date || p.startDate).toLocaleDateString()}</span>
              {(p.end_date || p.endDate) && <span>End: {new Date(p.end_date || p.endDate).toLocaleDateString()}</span>}
              {p.next_run_at && <span>Next: {new Date(p.next_run_at).toLocaleDateString()}</span>}
            </div>
            {p.status === 'active' && (
              <button className="cancel-btn" onClick={() => handleCancel(p.id)}>Cancel Schedule</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scheduled;
