import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CreditCard, 
  Building, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  Loader,
  Calendar,
  Database
} from 'lucide-react';
import { bankingService } from '../../lib/bankingService';
import BankingSync from './BankingSync';
import BankingConnectionTest from './BankingConnectionTest';
import type { BankConnection, BankInstitution, SyncResult } from '../../types/banking';

const BankConnections: React.FC = () => {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [institutions, setInstitutions] = useState<BankInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'sync' | 'test'>('connections');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialiser le service bancaire s'il n'est pas configuré
      if (!bankingService.isConfigured()) {
        try {
          await bankingService.initialize();
        } catch (initError) {
          setError('Erreur lors de l\'initialisation du service bancaire. Vérifiez votre connexion internet.');
          console.error('Erreur initialisation service bancaire:', initError);
          return;
        }
      }

      const [connectionsData, institutionsData] = await Promise.all([
        bankingService.getBankConnections(),
        bankingService.getInstitutions('FR')
      ]);

      setConnections(connectionsData);
      setInstitutions(institutionsData);
    } catch (err) {
      setError('Erreur lors du chargement des données bancaires');
      console.error('Erreur chargement données bancaires:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = async () => {
    if (!selectedInstitution) return;

    try {
      setConnecting(true);
      setError(null);

      const { link } = await bankingService.createBankConnection(selectedInstitution);
      
      // Ouvrir le lien dans une nouvelle fenêtre
      const popup = window.open(
        link,
        'bank-auth',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      // Surveiller la fermeture de la popup
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Rafraîchir les données après la connexion
          setTimeout(loadData, 2000);
          setShowAddBank(false);
          setSelectedInstitution('');
        }
      }, 1000);

    } catch (err) {
      setError('Erreur lors de la création de la connexion bancaire');
      console.error('Erreur connexion bancaire:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (connectionId?: string) => {
    try {
      setSyncing(true);
      setError(null);

      if (!connectionId) {
        throw new Error('Connection ID is required for synchronization');
      }

      const result: SyncResult = await bankingService.syncTransactions(connectionId);
      
      if (result.success) {
        setSuccess(`${result.transactionsImported} transaction(s) importée(s) depuis ${result.accountsSynced} compte(s)`);
        await loadData();
      } else {
        setError(`Synchronisation partiellement échouée: ${result.errors.join(', ')}`);
      }
    } catch (err) {
      setError('Erreur lors de la synchronisation');
      console.error('Erreur sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter ce compte bancaire ?')) {
      return;
    }

    try {
      await bankingService.disconnectBank(connectionId);
      setSuccess('Compte bancaire déconnecté');
      await loadData();
    } catch (err) {
      setError('Erreur lors de la déconnexion');
      console.error('Erreur déconnexion:', err);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête avec onglets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comptes bancaires</h2>
            <p className="text-gray-600">Gérez vos connexions bancaires et synchronisez vos transactions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSync()}
              disabled={syncing || connections.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {syncing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Synchroniser tout</span>
            </button>
            <button
              onClick={() => setShowAddBank(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une banque</span>
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('connections')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'connections'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Connexions bancaires
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sync'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Synchronisation
              </div>
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Test API
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'connections' ? (
        <>
          {/* Liste des connexions */}
          {connections.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun compte bancaire connecté</h3>
              <p className="text-gray-600 mb-6">
                Connectez vos comptes bancaires pour importer automatiquement vos transactions
              </p>
              <button
                onClick={() => setShowAddBank(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Ajouter votre première banque</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {connections.map((connection) => (
                <div key={connection.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">{/* En-tête de la connexion */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{connection.institutionName}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        connection.status === 'connected' ? 'bg-green-500' : 
                        connection.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className={`text-sm ${
                        connection.status === 'connected' ? 'text-green-700' : 
                        connection.status === 'error' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {connection.status === 'connected' ? 'Connecté' : 
                         connection.status === 'error' ? 'Erreur' : 'En attente'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSync(connection.id)}
                    disabled={syncing}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Synchroniser"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Déconnecter"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Comptes */}
              <div className="space-y-3">
                {connection.accounts.map((account) => (
                  <div key={account.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{account.name}</p>
                          <p className="text-sm text-gray-600">
                            {account.iban.replace(/(.{4})/g, '$1 ').trim()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(account.balance.current, account.balance.currency)}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">{account.accountType}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informations de synchronisation */}
              {connection.lastSync && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Dernière sync: {formatDate(connection.lastSync)}</span>
                    </div>
                    {connection.expiresAt && (
                      <span className="text-xs">
                        Expire: {formatDate(connection.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </>
      ) : activeTab === 'sync' ? (
        <BankingSync />
      ) : (
        <BankingConnectionTest />
      )}

      {/* Modal d'ajout de banque */}
      {showAddBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une banque</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionnez votre banque
                </label>
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choisir une banque...</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Connexion sécurisée</p>
                    <p>Vous serez redirigé vers le site de votre banque pour autoriser l'accès à vos comptes.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddBank(false);
                  setSelectedInstitution('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddBank}
                disabled={!selectedInstitution || connecting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {connecting ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                <span>Connecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankConnections;
