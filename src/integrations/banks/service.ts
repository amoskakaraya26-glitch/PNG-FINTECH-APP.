import { KINAConnector } from './kina/connector';
import { BSPConnector } from './bsp/connector';
import { BankConnector } from './common/connector';

export type BankCode = 'kina' | 'bsp' | 'anz' | 'westpac' | 'mibank' | 'wmb' | 'ccb' | 'tisa' | 'creditbank';

export interface BankProvider {
  code: BankCode;
  name: string;
  implemented: boolean;
}

export class BankService {
  private connectors: Map<BankCode, BankConnector>;
  private readonly providers: BankProvider[] = [
    { code: 'kina', name: 'Kina Bank', implemented: true },
    { code: 'bsp', name: 'BSP Financial Group', implemented: true },
    { code: 'anz', name: 'ANZ PNG', implemented: false },
    { code: 'westpac', name: 'Westpac PNG', implemented: false },
    { code: 'mibank', name: 'MiBank', implemented: false },
    { code: 'wmb', name: "Women's Micro Bank", implemented: false },
    { code: 'tisa', name: 'Tisa Bank', implemented: false },
    { code: 'creditbank', name: 'Credit Bank', implemented: false },
    { code: 'ccb', name: 'Credit Corporation Bank', implemented: false },
  ];

  constructor() {
    this.connectors = new Map<BankCode, BankConnector>([
      [
        'kina',
        new KINAConnector(
          process.env.KINA_API_KEY || '',
          process.env.KINA_BASE_URL || 'https://your-real-kina-api-domain'
        ),
      ],
      [
        'bsp',
        new BSPConnector(
          process.env.BSP_API_KEY || '',
          process.env.BSP_BASE_URL || 'https://your-real-bsp-api-domain'
        ),
      ],
    ]);
  }

  getSupportedBanks(): BankProvider[] {
    return this.providers;
  }

  private normalizeBankCode(bank: string): BankCode {
    const normalized = bank.trim().toLowerCase().replace(/[\s_-]/g, '');
    const aliasMap: Record<string, BankCode> = {
      kina: 'kina',
      bsp: 'bsp',
      anz: 'anz',
      westpac: 'westpac',
      mibank: 'mibank',
      wmb: 'wmb',
      womensmicrobank: 'wmb',
      tisa: 'tisa',
      tisabank: 'tisa',
      creditbank: 'creditbank',
      cerditbank: 'creditbank',
      ccb: 'ccb',
      creditcorporation: 'ccb',
    };

    const mapped = aliasMap[normalized];
    if (!mapped) {
      const supported = this.providers.map(provider => provider.code).join(', ');
      throw new Error(`Unknown bank '${bank}'. Supported bank codes: ${supported}`);
    }

    return mapped;
  }

  getConnector(bank: string): BankConnector {
    const code = this.normalizeBankCode(bank);
    const connector = this.connectors.get(code);
    if (connector) {
      return connector;
    }

    const provider = this.providers.find(item => item.code === code);
    if (provider && !provider.implemented) {
      throw new Error(`${provider.name} integration is planned but not implemented yet`);
    }

    throw new Error('Unknown bank');
  }

  async linkBankAccount(bank: string, accountNumber: string, pin: string) {
    const connector = this.getConnector(bank);
    return connector.linkAccount(accountNumber, pin);
  }

  async getBankBalance(bank: string, accountNumber: string) {
    const connector = this.getConnector(bank);
    return connector.getBalance(accountNumber);
  }

  async transferFromBank(bank: string, fromAccount: string, toAccount: string, amount: number) {
    const connector = this.getConnector(bank);
    return connector.transfer(fromAccount, toAccount, amount);
  }

  async getBankTransactionHistory(bank: string, accountNumber: string, limit?: number) {
    const connector = this.getConnector(bank);
    return connector.getTransactionHistory(accountNumber, limit);
  }
}