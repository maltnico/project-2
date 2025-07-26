import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Database, Wifi } from 'lucide-react';
import { bankingService } from '../../lib/bankingService';

interface SyncStatus {
  isRunning: boolean;
  lastSync?: Date;
  totalConnections: number;
  successfulSyncs: number;
  errors: string[];
}

const BankingSync: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    totalConnections: 0,
    successfulSyncs: 0,
    errors: []
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60); // minutes

  useEffect(() => {
    // Vérifier les connexions en attente au démarrage
    checkPendingConnections();
    
    // Démarrer la synchronisation automatique si configurée
    const savedAutoSync = localStorage.getItem('banking-auto-sync');
    if (savedAutoSync === 'enabled') {
      setAutoSyncEnabled(true);
      bankingService.startAutoSync(syncInterval);
    }

    return () => {
      bankingService.stopAutoSync();
    };
  }, []);

  const checkPendingConnections = async () => {
    try {
      await bankingService.checkPendingConnections();
    } catch (error) {
      console.error('Erreur lors de la vérification des connexions:', error);
    }
  };

  const handleManualSync = async () => {
    setSyncStatus(prev => ({ ...prev, isRunning: true, errors: [] }));
    
    try {
      const results = await bankingService.syncAllConnections();
      setSyncStatus({
        isRunning: false,
        lastSync: new Date(),
        totalConnections: results.totalConnections,
        successfulSyncs: results.successfulSyncs,
        errors: results.errors
      });
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isRunning: false,
        errors: ['Erreur générale de synchronisation']
      }));
    }
  };

  const toggleAutoSync = () => {
    const newEnabled = !autoSyncEnabled;
    setAutoSyncEnabled(newEnabled);
    
    if (newEnabled) {
      bankingService.startAutoSync(syncInterval);
      localStorage.setItem('banking-auto-sync', 'enabled');
    } else {
      bankingService.stopAutoSync();
      localStorage.setItem('banking-auto-sync', 'disabled');
    }
  };

  const handleIntervalChange = (minutes: number) => {
    setSyncInterval(minutes);
    if (autoSyncEnabled) {
      bankingService.stopAutoSync();
      bankingService.startAutoSync(minutes);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Synchronisation Bancaire
        </h2>
      </div>

      {/* Status de la dernière synchronisation */}
      {syncStatus.lastSync && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Dernière synchronisation réussie</p>
              <p>
                {syncStatus.lastSync.toLocaleString('fr-FR')} - 
                {syncStatus.successfulSyncs}/{syncStatus.totalConnections} connexions synchronisées
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Erreurs */}
      {syncStatus.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">Erreurs de synchronisation :</p>
              <ul className="list-disc list-inside space-y-1">
                {syncStatus.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Contrôles de synchronisation */}
      <div className="space-y-6">
        {/* Synchronisation manuelle */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Synchronisation manuelle</p>
              <p className="text-sm text-gray-600">
                Synchroniser immédiatement toutes les connexions bancaires
              </p>
            </div>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncStatus.isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {syncStatus.isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Synchroniser
              </>
            )}
          </button>
        </div>

        {/* Synchronisation automatique */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Synchronisation automatique</p>
                <p className="text-sm text-gray-600">
                  Synchroniser automatiquement à intervalles réguliers
                </p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={toggleAutoSync}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSyncEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>

          {autoSyncEnabled && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Intervalle de synchronisation :</p>
              <div className="flex gap-2">
                {[15, 30, 60, 120, 240].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => handleIntervalChange(minutes)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      syncInterval === minutes
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {minutes < 60 ? `${minutes}min` : `${minutes / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informations sur l'API GoCardless */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Wifi className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-2">Synchronisation avec GoCardless API</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Les données sont récupérées directement depuis votre banque</li>
                <li>Stockage sécurisé en local dans votre navigateur</li>
                <li>Synchronisation des comptes et transactions en temps réel</li>
                <li>Aucune donnée bancaire n'est envoyée vers nos serveurs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Comment ça fonctionne :</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Connectez vos comptes bancaires via GoCardless</li>
            <li>Les données sont automatiquement synchronisées depuis votre banque</li>
            <li>Toutes les informations sont stockées localement sur votre appareil</li>
            <li>Utilisez la synchronisation manuelle ou automatique pour rester à jour</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default BankingSync;
