import React, { useState, useEffect } from 'react';
import './Banks.css';
import { apiFetch } from '../utils/api';

interface BankAccount {
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
}

const Banks: React.FC = () => {
  const [bankCode, setBankCode] = useState<'kina' | 'bsp'>('kina');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [pin, setPin] = useState('');
  const [linkedAccounts, setLinkedAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadLinkedAccounts();
  }, []);

  const loadLinkedAccounts = async () => {
    // In a real app, you'd fetch linked accounts from the API
    // For now, we'll show mock data
    setLinkedAccounts([
      {
        accountNumber: '1234567890',
        accountName: 'John Doe',
        balance: 1500.00,
        currency: 'PGK'
      }
    ]);
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !accountName || !pin) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await apiFetch('/api/bank/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank: bankCode,
          accountNumber,
          accountName,
          pin,
        }),
      });

      if (response.ok) {
        await response.json();
        setMessage('Bank account linked successfully!');
        setAccountNumber('');
        setAccountName('');
        setPin('');
        await loadLinkedAccounts();
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to link bank account');
      }
    } catch (error) {
      setMessage('Failed to link bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToWallet = async (accountNumber: string) => {
    // In a real app, this would open a modal or form to specify amount and wallet
    setMessage('Transfer functionality would be implemented here');
  };

  return (
    <div className="banks">
      <h1>Bank Integration</h1>
      <p>Link your KINA and BSP bank accounts</p>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
          <button onClick={() => setMessage('')} className="close-btn">×</button>
        </div>
      )}

      <div className="banks-content">
        <div className="link-account-section">
          <h2>Link Bank Account</h2>
          <form onSubmit={handleLinkAccount} className="link-form">
            <div className="form-group">
              <label htmlFor="bankCode">Bank</label>
              <select
                id="bankCode"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value as 'kina' | 'bsp')}
              >
                <option value="kina">KINA Bank</option>
                <option value="bsp">BSP Bank</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="accountNumber">Account Number</label>
              <input
                type="text"
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="accountName">Account Name</label>
              <input
                type="text"
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pin">PIN</label>
              <input
                type="password"
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Linking...' : 'Link Account'}
            </button>
          </form>
        </div>

        <div className="linked-accounts-section">
          <h2>Linked Accounts</h2>
          {linkedAccounts.length === 0 ? (
            <p className="no-accounts">No bank accounts linked yet</p>
          ) : (
            <div className="accounts-list">
              {linkedAccounts.map((account, index) => (
                <div key={index} className="account-card">
                  <div className="account-info">
                    <h3>{account.accountName}</h3>
                    <p className="account-number">****{account.accountNumber.slice(-4)}</p>
                    <p className="balance">
                      <span className="currency">PGK</span>
                      <span className="amount">{account.balance.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="account-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleTransferToWallet(account.accountNumber)}
                    >
                      Transfer to Wallet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="banks-info">
        <h3>Supported Banks</h3>
        <div className="supported-banks">
          <div className="bank-item">
            <h4>KINA Bank</h4>
            <p>Papua New Guinea's largest commercial bank</p>
          </div>
          <div className="bank-item">
            <h4>Bank South Pacific (BSP)</h4>
            <p>Major banking services across PNG</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banks;