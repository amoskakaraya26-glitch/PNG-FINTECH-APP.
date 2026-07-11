import transferOrchestrator from '../../src/transfers/services/transfer.orchestrator';

import transactionManager from '../../src/database/transaction.manager';
import transactionRepository from '../../src/transactions/repositories/transaction.repository';
import ledgerRepository from '../../src/ledger/repositories/ledger.repository';
import auditRepository from '../../src/audit/repositories/audit.repository';

jest.mock('../../src/database/transaction.manager');
jest.mock('../../src/transactions/repositories/transaction.repository');
jest.mock('../../src/ledger/repositories/ledger.repository');
jest.mock('../../src/audit/repositories/audit.repository');

describe('Transfer Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (transactionManager.execute as jest.Mock).mockImplementation(
      async (callback: () => Promise<unknown>) => callback()
    );
  });

  describe('execute()', () => {
    it('creates a completed transfer successfully', async () => {
      (transactionRepository.create as jest.Mock).mockResolvedValue({
        id: 'txn-001'
      });

      (ledgerRepository.createEntry as jest.Mock).mockResolvedValue({});
      (auditRepository.record as jest.Mock).mockResolvedValue({});
      (transactionRepository.updateStatus as jest.Mock).mockResolvedValue({});

      const result = await transferOrchestrator.execute({
        userId: 'user-1',
        fromWallet: 'wallet-a',
        toWallet: 'wallet-b',
        amount: 100,
        currency: 'PGK'
      });

      expect(transactionRepository.create).toHaveBeenCalledTimes(1);

      expect(ledgerRepository.createEntry).toHaveBeenCalledTimes(2);

      expect(auditRepository.record).toHaveBeenCalledTimes(1);

      expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
        'txn-001',
        'COMPLETED'
      );

      expect(result).toEqual({
        transactionId: 'txn-001',
        status: 'COMPLETED',
        amount: 100,
        currency: 'PGK',
        reference: undefined
      });
    });

    it('propagates repository failures', async () => {
      (transactionRepository.create as jest.Mock).mockRejectedValue(
        new Error('database failure')
      );

      await expect(
        transferOrchestrator.execute({
          userId: 'user-1',
          fromWallet: 'wallet-a',
          toWallet: 'wallet-b',
          amount: 100,
          currency: 'PGK'
        })
      ).rejects.toThrow('database failure');
    });
  });
});