import { useState, useEffect } from 'react';
import { BankTransaction, BankAccount } from '../types/banking';
import { localBankingStorage } from '../lib/localBankingStorage';

interface UseBankTransactionsReturn {
  transactions: BankTransaction[];
  accounts: BankAccount[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useBankTransactions = (): UseBankTransactionsReturn => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBankTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les connexions bancaires depuis le stockage local
      const connections = localBankingStorage.getConnections();
      
      // Extraire tous les comptes de toutes les connexions
      const allAccounts: BankAccount[] = [];
      connections.forEach(connection => {
        if (connection.accounts && connection.accounts.length > 0) {
          allAccounts.push(...connection.accounts);
        }
      });

      // Charger les transactions depuis le stockage local
      const allTransactions = localBankingStorage.getTransactions();

      setAccounts(allAccounts);
      setTransactions(allTransactions);

    } catch (err) {
      console.error('Erreur lors du chargement des données bancaires:', err);
      setError('Erreur lors du chargement des données bancaires');
      // En cas d'erreur, définir des valeurs par défaut
      setAccounts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadBankTransactions();
  };

  useEffect(() => {
    loadBankTransactions();
  }, []);

  return {
    transactions,
    accounts,
    loading,
    error,
    refresh
  };
};
