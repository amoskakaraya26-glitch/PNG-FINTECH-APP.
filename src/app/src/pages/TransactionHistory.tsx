import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './TransactionHistory.css';

const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const load = (p = 1, t = 'all') => {
    setLoading(true);
    const params: any = { page: p, limit: 20 };
    if (t !== 'all') params.type = t;
    transferAPI.getHistory(params)
      .then(r => setTransactions(r.data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page, filter); }, [page, filter]);

  const typeIcon: Record<string, string> = {
    transfer: '💸', topup: '⬇️', bill: '📄', payment: '🛍️', default: '💳'
  };

  const filters = ['all', 'transfer', 'topup', 'bill', 'payment'];

  return (
    <div className="tx-history">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Transaction History</span>
      </div>

      <div className="filter-bar">
        {filters.map(f => (
          <button
            key={f}
            className={filter === f ? 'active' : ''}
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="tx-list">
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">No transactions found</div>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="tx-item" onClick={() => setSelected(tx)}>
              <div className="tx-icon-circle">
                {typeIcon[tx.type] || typeIcon.default}
              </div>
              <div className="tx-details">
                <div className="tx-desc">{tx.description || tx.type}</div>
                <div className="tx-meta">
                  {tx.sender_name || tx.receiver_name ? (
                    <span>{tx.sender_id === user?.id ? `To: ${tx.receiver_name}` : `From: ${tx.sender_name}`}</span>
                  ) : null}
                  <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={`tx-amt ${tx.sender_id === user?.id ? 'debit' : 'credit'}`}>
                {tx.sender_id === user?.id ? '-' : '+'}PGK {parseFloat(tx.amount).toFixed(2)}
              </div>
            </div>
          ))
        )}

        {transactions.length === 20 && (
          <button className="load-more" onClick={() => setPage(p => p + 1)}>Load More</button>
        )}
      </div>

      {selected && (
        <div className="tx-modal-overlay" onClick={() => setSelected(null)}>
          <div className="tx-modal" onClick={e => e.stopPropagation()}>
            <div className="tx-modal-header">
              <h3>Transaction Details</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="tx-modal-icon">{typeIcon[selected.type] || typeIcon.default}</div>
            <div className="tx-modal-amount" style={{ color: selected.sender_id === user?.id ? '#ef4444' : '#10b981' }}>
              {selected.sender_id === user?.id ? '-' : '+'}PGK {parseFloat(selected.amount).toFixed(2)}
            </div>
            <div className="tx-modal-rows">
              <div className="tx-modal-row"><span>Type</span><span>{selected.type}</span></div>
              <div className="tx-modal-row"><span>Status</span><span className={`status-badge ${selected.status}`}>{selected.status}</span></div>
              <div className="tx-modal-row"><span>Description</span><span>{selected.description || '-'}</span></div>
              {selected.sender_name && <div className="tx-modal-row"><span>From</span><span>{selected.sender_name}</span></div>}
              {selected.receiver_name && <div className="tx-modal-row"><span>To</span><span>{selected.receiver_name}</span></div>}
              <div className="tx-modal-row"><span>Date</span><span>{new Date(selected.created_at).toLocaleString()}</span></div>
              <div className="tx-modal-row"><span>Transaction ID</span><span className="tx-id">{selected.id}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
