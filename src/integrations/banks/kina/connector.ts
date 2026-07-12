import { BankConnector, BankAccount, BankTransfer } from '../common/connector';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class KINAConnector extends BankConnector {
  constructor(apiKey: string, baseUrl: string) {
    super(apiKey, baseUrl, 'KINA', 'KINA_API_KEY', 'KINA_BASE_URL');
  }

  async linkAccount(
    accountNumber: string,
    pin: string
  ): Promise<BankAccount> {
    if (this.useMockMode()) {
      return {
        accountNumber,
        accountName: 'Test Account',
        balance: 1000,
        currency: 'PGK'
      };
    }

    this.ensureConfigured();

    try {
      const response = await axios.post(
        `${this.baseUrl}/account/link`,
        {
          accountNumber,
          pin
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        accountNumber: response.data.accountNumber,
        accountName: response.data.accountName,
        balance: response.data.balance,
        currency: 'PGK'
      };
    } catch (error) {
      console.error('KINA account link failed:', error);
      throw new Error('Failed to link KINA account');
    }
  }

  async getBalance(accountNumber: string): Promise<number> {
    if (this.useMockMode()) {
      return 1500;
    }

    this.ensureConfigured();

    try {
      const response = await axios.get(
        `${this.baseUrl}/account/${accountNumber}/balance`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.balance;
    } catch (error) {
      console.error('KINA balance fetch failed:', error);
      throw new Error('Failed to fetch KINA balance');
    }
  }

  async transfer(
    fromAccount: string,
    toAccount: string,
    amount: number
  ): Promise<BankTransfer> {
    if (this.useMockMode()) {
      return {
        id: uuidv4(),
        fromAccount,
        toAccount,
        amount,
        status: 'completed',
        timestamp: new Date()
      };
    }

    this.ensureConfigured();

    try {
      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        {
          fromAccount,
          toAccount,
          amount,
          transactionId: uuidv4()
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        id: response.data.transactionId,
        fromAccount,
        toAccount,
        amount,
        status: response.data.status,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('KINA transfer failed:', error);
      throw new Error('Failed to process KINA transfer');
    }
  }

  async getTransactionHistory(
    accountNumber: string,
    limit = 10
  ): Promise<any[]> {
    if (this.useMockMode()) {
      return [];
    }

    this.ensureConfigured();

    try {
      const response = await axios.get(
        `${this.baseUrl}/account/${accountNumber}/transactions`,
        {
          params: { limit },
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.transactions;
    } catch (error) {
      console.error(
        'KINA transaction history fetch failed:',
        error
      );
      throw new Error('Failed to fetch KINA transaction history');
    }
  }
}