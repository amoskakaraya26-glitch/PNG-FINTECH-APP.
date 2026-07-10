import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './Analytics.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<any>({ byCategory: [], byDay: [], totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    transferAPI.getAnalytics({ period })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const categoryData = data.byCategory.map((c: any) => ({
    name: c.category || 'Other',
    value: parseFloat(c.total) || 0,
    count: c.count
  }));

  const dailyData = data.byDay.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    amount: parseFloat(d.total) || 0
  }));

  return (
    <div className="analytics">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Spending Analytics</span>
      </div>

      <div className="period-selector">
        {['week', 'month', 'year'].map(p => (
          <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="analytics-content">
        <div className="total-card">
          <span className="total-label">Total Spent ({period})</span>
          <span className="total-amount">PGK {parseFloat(data.totalSpent || 0).toFixed(2)}</span>
        </div>

        {loading ? (
          <div className="loading-state">Loading analytics...</div>
        ) : (
          <>
            {dailyData.length > 0 && (
              <div className="chart-card">
                <h3>Daily Spending</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`PGK ${parseFloat(v).toFixed(2)}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {categoryData.length > 0 && (
              <div className="chart-card">
                <h3>By Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`PGK ${parseFloat(v).toFixed(2)}`, 'Spent']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="category-list">
                  {categoryData.map((c: any, i: number) => (
                    <div key={i} className="category-row">
                      <div className="category-dot" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="category-name">{c.name}</span>
                      <span className="category-count">{c.count} txns</span>
                      <span className="category-amount">PGK {c.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {categoryData.length === 0 && dailyData.length === 0 && (
              <div className="empty-state">No spending data for this period</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
