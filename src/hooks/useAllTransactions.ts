import { useState, useMemo } from 'react';
import { useFinances } from './useFinances';
import { useBankTransactions } from './useBankTransactions';
import { useProperties } from './useProperties';
import { UnifiedTransaction, TransactionFilters, TransactionStats } from '../types/transactions';

interface UseAllTransactionsReturn {
  transactions: UnifiedTransaction[];
  filteredTransactions: UnifiedTransaction[];
  stats: TransactionStats;
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  refresh: () => Promise<void>;
}

export const useAllTransactions = (): UseAllTransactionsReturn => {
  const { flows, loading: financialLoading, error: financialError, refreshDashboard } = useFinances();
  const { transactions: bankTransactions, accounts, loading: bankLoading, error: bankError, refresh: refreshBank } = useBankTransactions();
  const { properties } = useProperties();

  const [filters, setFiltersState] = useState<TransactionFilters>({
    searchTerm: '',
    type: 'all',
    source: 'all',
    category: 'all',
    status: 'all',
    propertyType: 'all'
  });

  // Combiner les transactions financières et bancaires avec gestion d'erreurs
  const allTransactions = useMemo((): UnifiedTransaction[] => {
    const unified: UnifiedTransaction[] = [];

    try {
      // Ajouter les transactions financières
      if (flows && Array.isArray(flows)) {
        flows.forEach(flow => {
          try {
            const property = properties.find(p => p.id === flow.propertyId);
            
            unified.push({
              id: `financial_${flow.id}`,
              type: 'financial',
              source: 'manual',
              amount: flow.type === 'income' ? flow.amount : -flow.amount,
              currency: 'EUR', // À adapter selon la configuration
              date: flow.date,
              description: flow.description,
              category: flow.category,
              reference: flow.reference,
              financialData: {
                flow,
                propertyName: flow.propertyName || property?.name,
                tenantName: flow.tenantName,
                status: flow.status,
                paymentMethod: flow.paymentMethod,
                recurring: flow.recurring
              },
              tags: flow.tags,
              notes: flow.notes,
              metadata: flow.metadata
            });
          } catch (flowError) {
            console.warn('Erreur lors du traitement d\'une transaction financière:', flowError);
          }
        });
      }

      // Ajouter les transactions bancaires si disponibles
      if (bankTransactions && Array.isArray(bankTransactions)) {
        bankTransactions.forEach(transaction => {
          try {
            const account = accounts.find(a => a.id === transaction.accountId);
            
            unified.push({
              id: `bank_${transaction.id}`,
              type: 'bank',
              source: 'bank_import',
              amount: transaction.type === 'credit' ? Math.abs(transaction.amount) : -Math.abs(transaction.amount),
              currency: transaction.currency,
              date: transaction.date,
              description: transaction.description,
              category: transaction.category,
              reference: transaction.reference,
              bankData: {
                transaction,
                accountName: account?.name || 'Compte inconnu',
                accountIban: account?.iban || '',
                counterpartyName: transaction.counterpartyName,
                valueDate: transaction.valueDate,
                transactionType: transaction.type
              },
              metadata: transaction.metadata
            });
          } catch (transactionError) {
            console.warn('Erreur lors du traitement d\'une transaction bancaire:', transactionError);
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la combinaison des transactions:', error);
    }

    // Trier par date (plus récent en premier)
    return unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [flows, bankTransactions, accounts, properties]);

  // Filtrer les transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      // Filtre par terme de recherche
      const searchText = `${transaction.description} ${transaction.category || ''} ${transaction.reference || ''}`.toLowerCase();
      if (filters.searchTerm && !searchText.includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Filtre par type (income/expense)
      if (filters.type !== 'all') {
        const isIncome = transaction.amount > 0;
        if ((filters.type === 'income' && !isIncome) || (filters.type === 'expense' && isIncome)) {
          return false;
        }
      }

      // Filtre par source
      if (filters.source !== 'all' && transaction.source !== filters.source) {
        return false;
      }

      // Filtre par catégorie
      if (filters.category !== 'all' && transaction.category !== filters.category) {
        return false;
      }

      // Filtre par statut (seulement pour les transactions financières)
      if (filters.status !== 'all' && transaction.type === 'financial') {
        if (transaction.financialData?.status !== filters.status) {
          return false;
        }
      }

      // Filtre par compte bancaire
      if (filters.accountId && transaction.type === 'bank') {
        if (transaction.bankData?.transaction.accountId !== filters.accountId) {
          return false;
        }
      }

      // Filtre par plage de dates
      if (filters.dateRange) {
        const transactionDate = new Date(transaction.date);
        if (transactionDate < filters.dateRange.start || transactionDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [allTransactions, filters]);

  // Calculer les statistiques avec gestion d'erreur
  const stats = useMemo((): TransactionStats => {
    try {
      const totalIncome = allTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = allTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const manualTransactions = allTransactions.filter(t => t.source === 'manual');
      const manualIncome = manualTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const manualExpense = manualTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const bankImportTransactions = allTransactions.filter(t => t.source === 'bank_import');
      const bankIncome = bankImportTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const bankExpense = bankImportTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Statistiques par catégorie
      const byCategory: Record<string, { count: number; amount: number; type: 'income' | 'expense' }> = {};
      allTransactions.forEach(transaction => {
        const category = transaction.category || 'Non catégorisé';
        if (!byCategory[category]) {
          byCategory[category] = {
            count: 0,
            amount: 0,
            type: transaction.amount > 0 ? 'income' : 'expense'
          };
        }
        byCategory[category].count++;
        byCategory[category].amount += Math.abs(transaction.amount);
      });

      return {
        total: {
          count: allTransactions.length,
          income: totalIncome,
          expense: totalExpense,
          net: totalIncome - totalExpense
        },
        manual: {
          count: manualTransactions.length,
          income: manualIncome,
          expense: manualExpense
        },
        bankImport: {
          count: bankImportTransactions.length,
          income: bankIncome,
          expense: bankExpense
        },
        byCategory
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        total: { count: 0, income: 0, expense: 0, net: 0 },
        manual: { count: 0, income: 0, expense: 0 },
        bankImport: { count: 0, income: 0, expense: 0 },
        byCategory: {}
      };
    }
  }, [allTransactions]);

  const setFilters = (newFilters: Partial<TransactionFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const refresh = async () => {
    try {
      await Promise.all([
        refreshDashboard().catch(err => console.warn('Erreur refresh dashboard:', err)),
        refreshBank().catch(err => console.warn('Erreur refresh bank:', err))
      ]);
    } catch (error) {
      console.error('Erreur lors du refresh des transactions:', error);
    }
  };

  const loading = financialLoading || bankLoading;
  const error = financialError || bankError;

  return {
    transactions: allTransactions,
    filteredTransactions,
    stats,
    loading,
    error,
    filters,
    setFilters,
    refresh
  };
};
