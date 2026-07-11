import transactionManager from '../../database/transaction.manager';

import transactionRepository from '../../transactions/repositories/transaction.repository';
import ledgerRepository from '../../ledger/repositories/ledger.repository';
import auditRepository from '../../audit/repositories/audit.repository';

import {
  TransferRequest,
  TransferResult
} from '../models/transfer.model';

class TransferOrchestrator {
  async execute(
    request: TransferRequest
  ): Promise<TransferResult> {
    return transactionManager.execute(async () => {
      const transaction = await transactionRepository.create({
        fromWallet: request.fromWallet,
        toWallet: request.toWallet,
        amount: request.amount,
        currency: request.currency
      });

      await ledgerRepository.createEntry({
        walletId: request.fromWallet,
        transactionId: transaction.id,
        type: 'DEBIT',
        amount: request.amount,
        currency: request.currency
      });

      await ledgerRepository.createEntry({
        walletId: request.toWallet,
        transactionId: transaction.id,
        type: 'CREDIT',
        amount: request.amount,
        currency: request.currency
      });

      await auditRepository.record({
        userId: request.userId,
        action: 'TRANSFER'
      });

      await transactionRepository.updateStatus(
        transaction.id,
        'COMPLETED'
      );

      return {
        transactionId: transaction.id,
        status: 'COMPLETED',
        amount: request.amount,
        currency: request.currency,
        reference: request.reference
      };
    });
  }
}

export default new TransferOrchestrator();