import { useState, useEffect } from 'react';
import { bankingService } from '../lib/bankingService';
import type { 
  BankConnection, 
  BankInstitution, 
  BankingConfiguration as BankingConfigType, 
  SyncResult 
} from '../types/banking';

export function useBanking() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [institutions, setInstitutions] = useState<BankInstitution[]>([]);
  const [config, setConfig] = useState<BankingConfigType | null>(null);
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

      const currentConfig = bankingService.getConfiguration();
      setConfig(currentConfig);

      if (bankingService.isConfigured()) {
        const [connectionsData, institutionsData] = await Promise.all([
          bankingService.getBankConnections(),
          bankingService.getInstitutions('FR')
        ]);

        setConnections(connectionsData);
        setInstitutions(institutionsData);
      }
    } catch (err) {
      console.error('Erreur chargement données bancaires:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Configuration
  const updateConfiguration = async (newConfig: Partial<BankingConfigType>) => {
    try {
      setError(null);
      
      // Merge with current config to ensure all required fields are present
      const currentConfig = bankingService.getConfiguration();
      const fullConfig = {
        goCardlessAccessToken: newConfig.goCardlessAccessToken || currentConfig?.goCardlessAccessToken || '',
        environment: newConfig.environment || currentConfig?.environment || 'sandbox',
        defaultCountry: newConfig.defaultCountry || currentConfig?.defaultCountry || 'FR',
        autoSync: newConfig.autoSync ?? currentConfig?.autoSync ?? true,
        syncFrequency: newConfig.syncFrequency || currentConfig?.syncFrequency || 'daily',
        categorizeTransactions: newConfig.categorizeTransactions ?? currentConfig?.categorizeTransactions ?? true,
        ...newConfig
      };
      
      await bankingService.updateConfiguration(fullConfig);
      setConfig(bankingService.getConfiguration());
      
      // Recharger les données si la configuration devient valide
      if (bankingService.isConfigured()) {
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
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
    config,
    loading,
    syncing,
    error,

    // Actions
    loadData,
    updateConfiguration,
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
