export interface BankAccount {
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
}

export interface BankTransfer {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

export abstract class BankConnector {
  protected apiKey: string;
  protected baseUrl: string;
  private providerName: string;
  private apiKeyEnvVar: string;
  private baseUrlEnvVar: string;

  constructor(apiKey: string, baseUrl: string, providerName: string, apiKeyEnvVar: string, baseUrlEnvVar: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.providerName = providerName;
    this.apiKeyEnvVar = apiKeyEnvVar;
    this.baseUrlEnvVar = baseUrlEnvVar;
  }

  protected useMockMode(): boolean {
    return process.env.BANKS_USE_MOCK === 'true';
  }

  protected ensureConfigured(): void {
    if (this.useMockMode()) {
      return;
    }

    const hasApiKey = this.apiKey && !this.apiKey.startsWith('your_');
    const hasBaseUrl = this.baseUrl && this.baseUrl.startsWith('http') && !this.baseUrl.includes('your-real-');
    if (!hasApiKey || !hasBaseUrl) {
      throw new Error(
        `${this.providerName} bank is not configured for real credentials. Set ${this.apiKeyEnvVar} and ${this.baseUrlEnvVar} in .env, or set BANKS_USE_MOCK=true for testing.`
      );
    }
  }

  abstract linkAccount(accountNumber: string, pin: string): Promise<BankAccount>;
  abstract getBalance(accountNumber: string): Promise<number>;
  abstract transfer(fromAccount: string, toAccount: string, amount: number): Promise<BankTransfer>;
  abstract getTransactionHistory(accountNumber: string, limit?: number): Promise<any[]>;
}