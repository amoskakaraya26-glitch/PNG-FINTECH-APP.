import { QueryClient } from "./transfer.service";

export type LedgerEntryType = "DEBIT" | "CREDIT";

export interface LedgerEntryInput {
  transactionId: string;
  walletId: string;
  entryType: LedgerEntryType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
}

export interface TransferLedgerInput {
  transactionId: string;

  senderWalletId: string;
  receiverWalletId: string;

  amount: number;

  senderBalanceBefore: number;
  senderBalanceAfter: number;

  receiverBalanceBefore: number;
  receiverBalanceAfter: number;

  description?: string;
}

export default class LedgerService {
  /**
   * Internal helper used by all ledger operations.
   */
  private static async recordEntry(
    client: QueryClient,
    input: LedgerEntryInput
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO ledger_entries (
        id,
        transaction_id,
        wallet_id,
        entry_type,
        amount,
        balance_before,
        balance_after,
        description
      )
      VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7
      )
      `,
      [
        input.transactionId,
        input.walletId,
        input.entryType,
        input.amount,
        input.balanceBefore,
        input.balanceAfter,
        input.description ?? "P2P Transfer",
      ]
    );
  }

  static async recordDebit(
    client: QueryClient,
    input: Omit<LedgerEntryInput, "entryType">
  ): Promise<void> {
    await this.recordEntry(client, {
      ...input,
      entryType: "DEBIT",
    });
  }

  static async recordCredit(
    client: QueryClient,
    input: Omit<LedgerEntryInput, "entryType">
  ): Promise<void> {
    await this.recordEntry(client, {
      ...input,
      entryType: "CREDIT",
    });
  }

  /**
   * Records both sides of a transfer.
   */
  static async recordTransfer(
    client: QueryClient,
    input: TransferLedgerInput
  ): Promise<void> {
    await this.recordDebit(client, {
      transactionId: input.transactionId,
      walletId: input.senderWalletId,
      amount: input.amount,
      balanceBefore: input.senderBalanceBefore,
      balanceAfter: input.senderBalanceAfter,
      description: input.description,
    });

    await this.recordCredit(client, {
      transactionId: input.transactionId,
      walletId: input.receiverWalletId,
      amount: input.amount,
      balanceBefore: input.receiverBalanceBefore,
      balanceAfter: input.receiverBalanceAfter,
      description: input.description,
    });
  }
}