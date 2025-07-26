import { useState, useEffect } from 'react';
import { bankingService } from '../lib/bankingService';
import type { 
  BankConnection, 
  BankInstitution, 
  SyncResult 
} from '../types/banking';

export function useBanking() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [institutions, setInstitutions] = useState<BankInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chargement initial des données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // S'assurer que le service est initialisé
      if (!bankingService.isConfigured()) {
        await bankingService.initialize();
      }

      const [connectionsData, institutionsData] = await Promise.all([
        bankingService.getBankConnections(),
        bankingService.getInstitutions('FR')
      ]);

      setConnections(connectionsData);
      setInstitutions(institutionsData);
    } catch (err) {
      console.error('Erreur chargement données bancaires:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Connexions bancaires
  const createBankConnection = async (institutionId: string) => {
    try {
      setError(null);
      const result = await bankingService.createBankConnection(institutionId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la connexion');
      throw err;
    }
  };

  const completeBankConnection = async (requisitionId: string) => {
    try {
      setError(null);
      const connection = await bankingService.completeBankConnection(requisitionId);
      await loadData(); // Rafraîchir les données
      return connection;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la finalisation de la connexion');
      throw err;
    }
  };

  const disconnectBank = async (connectionId: string) => {
    try {
      setError(null);
      await bankingService.disconnectBank(connectionId);
      await loadData(); // Rafraîchir les données
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la déconnexion');
      throw err;
    }
  };

  // Synchronisation
  const syncTransactions = async (connectionId?: string): Promise<SyncResult> => {
    try {
      setSyncing(true);
      setError(null);

      if (!connectionId) {
        throw new Error('Connection ID is required for synchronization');
      }

      const result = await bankingService.syncTransactions(connectionId);
      await loadData(); // Rafraîchir les données après sync
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la synchronisation');
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  // Informations
  const isConfigured = () => bankingService.isConfigured();

  const getActiveConnections = () => connections.filter(c => c.status === 'connected');

  const getTotalAccounts = () => connections.reduce((total, conn) => total + conn.accounts.length, 0);

  const getConnectionById = (id: string) => connections.find(c => c.id === id);

  const getInstitutionById = (id: string) => institutions.find(i => i.id === id);

  return {
    // Données
    connections,
    institutions,
    loading,
    syncing,
    error,

    // Actions
    loadData,
    createBankConnection,
    completeBankConnection,
    disconnectBank,
    syncTransactions,

    // Helpers
    isConfigured,
    getActiveConnections,
    getTotalAccounts,
    getConnectionById,
    getInstitutionById,

    // Reset error
    clearError: () => setError(null)
  };
}
