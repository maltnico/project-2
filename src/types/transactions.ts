import { FinancialFlow } from './financial';
import { BankTransaction } from './banking';

export interface UnifiedTransaction {
  id: string;
  type: 'financial' | 'bank';
  source: 'manual' | 'bank_import';
  
  // Données communes
  amount: number;
  currency: string;
  date: Date;
  description: string;
  category?: string;
  reference?: string;
  
  // Données financières (si type === 'financial')
  financialData?: {
    flow: FinancialFlow;
    propertyName?: string;
    tenantName?: string;
    status: 'pending' | 'completed' | 'cancelled';
    paymentMethod?: string;
    recurring: boolean;
  };
  
  // Données bancaires (si type === 'bank')
  bankData?: {
    transaction: BankTransaction;
    accountName: string;
    accountIban: string;
    counterpartyName?: string;
    valueDate?: Date;
    transactionType: 'debit' | 'credit';
  };
  
  // Métadonnées
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  searchTerm: string;
  type: 'all' | 'income' | 'expense';
  source: 'all' | 'manual' | 'bank_import';
  category: string;
  status: string;
  propertyType: string;
  accountId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TransactionStats {
  total: {
    count: number;
    income: number;
    expense: number;
    net: number;
  };
  manual: {
    count: number;
    income: number;
    expense: number;
  };
  bankImport: {
    count: number;
    income: number;
    expense: number;
  };
  byCategory: Record<string, {
    count: number;
    amount: number;
    type: 'income' | 'expense';
  }>;
}
