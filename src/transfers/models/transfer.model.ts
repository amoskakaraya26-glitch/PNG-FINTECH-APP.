export interface TransferRequest {
  userId: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  currency: string;
  reference?: string;
}

export interface TransferResult {
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  reference?: string;
}

export interface TransferReceipt {
  transactionId: string;
  senderWallet: string;
  receiverWallet: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: Date;
}