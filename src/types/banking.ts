export interface BankAccount {
  id: string;
  name: string;
  iban: string;
  bic?: string;
  currency: string;
  institutionId: string;
  institutionName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'other';
  balance: {
    current: number;
    available?: number;
    currency: string;
  };
  lastSync: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  date: Date;
  valueDate?: Date;
  description: string;
  reference?: string;
  category?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  type: 'debit' | 'credit';
  status: 'pending' | 'completed' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface BankInstitution {
  id: string;
  name: string;
  bic: string;
  country: string;
  logo?: string;
  maxHistoricalDays: number;
  supportsAccountDetails: boolean;
  supportsTransactions: boolean;
}

export interface BankConnection {
  id: string;
  userId: string;
  institutionId: string;
  institutionName: string;
  status: 'connected' | 'error' | 'expired' | 'disconnected';
  accounts: BankAccount[];
  lastSync?: Date;
  expiresAt?: Date;
  accessToken?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankingConfiguration {
  goCardlessAccessToken: string;
  environment: 'sandbox' | 'production';
  defaultCountry: string;
  autoSync: boolean;
  syncFrequency: 'daily' | 'weekly' | 'manual';
  categorizeTransactions: boolean;
}

export interface TransactionCategory {
  id: string;
  name: string;
  keywords: string[];
  type: 'income' | 'expense';
  financialCategoryId?: string; // Lien vers les catégories financières existantes
}

export interface SyncResult {
  success: boolean;
  accountsSynced: number;
  transactionsImported: number;
  errors: string[];
  lastSync: Date;
}
