export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'topup' | 'transfer' | 'payment' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  timestamp: Date;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  savisReference?: string;
  createdAt: Date;
}

export interface KYCVerification {
  id: string;
  userId: string;
  savisId: string;
  status: 'pending' | 'verified' | 'rejected';
  verificationData?: any;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}