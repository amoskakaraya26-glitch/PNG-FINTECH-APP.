import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';

interface Transaction {
  id: string;
  amount: number;
  type: 'transfer' | 'payment' | 'topup' | 'withdrawal' | 'reversal';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description?: string;
  fromWalletId: string;
  toWalletId: string;
  createdAt: string;
  completedAt?: string;
}

interface TransactionsHistoryProps {
  walletId?: string;
}

export const TransactionsHistory: React.FC<TransactionsHistoryProps> = ({ walletId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<{ status?: string; type?: string }>({});

  useEffect(() => {
    fetchTransactions();
  }, [page, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '20',
        offset: ((page - 1) * 20).toString(),
        ...(filter.status && { status: filter.status }),
        ...(filter.type && { type: filter.type }),
      });

      const response = await fetch(`/api/transactions/history?${params}`);
      const data = await response.json();

      setTransactions(data.transactions);
      setTotalPages(Math.ceil(data.total / 20));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      reversed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      transfer: '↔️',
      payment: '💳',
      topup: '💰',
      withdrawal: '💸',
      reversal: '↩️',
    };
    return icons[type] || '💱';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Transaction History</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">{error}</div>}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filter.status || ''}
          onChange={(e) => {
            setFilter({ ...filter, status: e.target.value });
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={filter.type || ''}
          onChange={(e) => {
            setFilter({ ...filter, type: e.target.value });
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Types</option>
          <option value="transfer">Transfer</option>
          <option value="payment">Payment</option>
          <option value="topup">Top Up</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-8">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No transactions found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-center py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    {formatDate(new Date(tx.createdAt))}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-lg">{getTypeIcon(tx.type)}</span> {' '}
                    <span className="capitalize">{tx.type}</span>
                  </td>
                  <td className="py-3 px-4 text-sm">{tx.description || '—'}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {tx.type === 'withdrawal' || tx.type === 'transfer' ? '-' : '+'}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(tx.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-2 rounded-lg ${
                  p === page ? 'bg-blue-600 text-white' : 'border'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsHistory;
