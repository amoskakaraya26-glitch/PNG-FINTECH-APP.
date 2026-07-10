import { BankConnector, BankAccount, BankTransfer } from '../common/connector';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class BSPConnector extends BankConnector {
  constructor(apiKey: string, baseUrl: string) {
    super(apiKey, baseUrl, 'BSP', 'BSP_API_KEY', 'BSP_BASE_URL');
  }

  async linkAccount(accountNumber: string, pin: string): Promise<BankAccount> {
    if (this.useMockMode()) {
      return {
        accountNumber,
        accountName: 'BSP Test Account',
        balance: 2000,
        currency: 'PGK',
      };
    }

    this.ensureConfigured();

    try {
      const response = await axios.post(`${this.baseUrl}/accounts/link`, {
        accountNumber,
        pin,
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });

      return {
        accountNumber: response.data.accountNumber,
        accountName: response.data.accountName,
        balance: response.data.balance,
        currency: 'PGK',
      };
    } catch (error) {
      console.error('BSP account link failed:', error);
      throw new Error('Failed to link BSP account');
    }
  }

  async getBalance(accountNumber: string): Promise<number> {
    if (this.useMockMode()) {
      return 2500;
    }

    this.ensureConfigured();

    try {
      const response = await axios.get(`${this.baseUrl}/accounts/${accountNumber}/balance`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.data.balance;
    } catch (error) {
      console.error('BSP balance fetch failed:', error);
      throw new Error('Failed to fetch BSP balance');
    }
  }

  async transfer(fromAccount: string, toAccount: string, amount: number): Promise<BankTransfer> {
    if (this.useMockMode()) {
      return {
        id: uuidv4(),
        fromAccount,
        toAccount,
        amount,
        status: 'completed',
        timestamp: new Date(),
      };
    }

    this.ensureConfigured();

    try {
      const response = await axios.post(`${this.baseUrl}/transfers`, {
        fromAccount,
        toAccount,
        amount,
        transactionId: uuidv4(),
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });

      return {
        id: response.data.transactionId,
        fromAccount,
        toAccount,
        amount,
        status: response.data.status,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('BSP transfer failed:', error);
      throw new Error('Failed to process BSP transfer');
    }
  }

  async getTransactionHistory(accountNumber: string, limit: number = 10): Promise<any[]> {
    if (this.useMockMode()) {
      return [];
    }

    this.ensureConfigured();

    try {
      const response = await axios.get(`${this.baseUrl}/accounts/${accountNumber}/transactions`, {
        params: { limit },
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.data.transactions;
    } catch (error) {
      console.error('BSP transaction history fetch failed:', error);
      throw new Error('Failed to fetch BSP transaction history');
    }
  }
}