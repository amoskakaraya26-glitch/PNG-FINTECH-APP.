import transactionManager from '../../database/transaction.manager';

import transactionRepository from '../../transactions/repositories/transaction.repository';
import ledgerRepository from '../../ledger/repositories/ledger.repository';
import auditRepository from '../../audit/repositories/audit.repository';

import {
  TransferRequest,
  TransferResult
} from '../models/transfer.model';

class TransferOrchestrator {
  public async execute(
    request: TransferRequest
  ): Promise<TransferResult> {
    return transactionManager.execute(async () => {
      // Create the transaction
      const transaction = await transactionRepository.create({
        fromWallet: request.fromWallet,
        toWallet: request.toWallet,
        amount: request.amount,
        currency: request.currency
      });

      // Debit sender wallet
      await ledgerRepository.createEntry({
        walletId: request.fromWallet,
        transactionId: transaction.id,
        type: 'DEBIT',
        amount: request.amount,
        currency: request.currency
      });

      // Credit receiver wallet
      await ledgerRepository.createEntry({
        walletId: request.toWallet,
        transactionId: transaction.id,
        type: 'CREDIT',
        amount: request.amount,
        currency: request.currency
      });

      // Record audit event
      await auditRepository.record({
        userId: request.userId,
        action: 'SEND_MONEY',
        details: {
          transactionId: transaction.id,
          fromWallet: request.fromWallet,
          toWallet: request.toWallet,
          amount: request.amount,
          currency: request.currency,
          reference: request.reference
        },
        risk: 'LOW'
      });

      // Mark transaction as completed
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