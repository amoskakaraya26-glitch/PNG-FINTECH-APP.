export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PIN_CHANGE'
  | 'SEND_MONEY'
  | 'BANK_LINK'
  | 'KYC_UPDATE'
  | 'FAILED_TRANSFER'
  | 'ADMIN_ACTION';

export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export interface AuditEvent {
  id: string;
  userId: string;
  action: AuditAction;
  details?: Record<string, any>;
  risk: RiskLevel;
  createdAt: Date;
}