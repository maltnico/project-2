/**
 * Composant pour afficher l'état de synchronisation et gérer les cookies
 */

import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Cookie, 
  Settings, 
  Check, 
  AlertCircle,
  Clock,
  Database,
  Trash2
} from 'lucide-react';
import { useEnhancedAuth } from '../hooks/useEnhancedAuth';
import { cookieManager } from '../lib/cookieManager';

interface SyncStatusDisplayProps {
  showDetails?: boolean;
  compact?: boolean;
}

const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({ 
  showDetails = false, 
  compact = false 
}) => {
  const { syncStatus, refreshData, clearCache, isSessionValid, extendSession } = useEnhancedAuth();
  const [isOnline] = useState(navigator.onLine);
  const [showCacheStats, setShowCacheStats] = useState(false);
  const [cacheStats, setCacheStats] = useState(cookieManager.getCacheStats());

  const handleRefreshData = async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  };

  const handleClearCache = () => {
    clearCache();
    setCacheStats(cookieManager.getCacheStats());
  };

  const handleExtendSession = () => {
    extendSession();
  };

  const updateCacheStats = () => {
    setCacheStats(cookieManager.getCacheStats());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Jamais';
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        {/* Indicateur de connectivité */}
        <div className="flex items-center">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>

        {/* Statut de synchronisation */}
        {syncStatus.isLoading ? (
          <div className="flex items-center text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            <span>Sync...</span>
          </div>
        ) : syncStatus.error ? (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Erreur</span>
          </div>
        ) : (
          <div className="flex items-center text-green-600">
            <Check className="h-4 w-4 mr-1" />
            <span>À jour</span>
          </div>
        )}

        {/* Session valide */}
        <div className="flex items-center">
          <Cookie className={`h-4 w-4 ${isSessionValid() ? 'text-green-500' : 'text-red-500'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <RefreshCw className="h-5 w-5 mr-2 text-blue-600" />
          État de synchronisation
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefreshData}
            disabled={syncStatus.isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualiser les données"
          >
            <RefreshCw className={`h-4 w-4 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              setShowCacheStats(!showCacheStats);
              if (!showCacheStats) updateCacheStats();
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Statistiques du cache"
          >
            <Database className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* État de connectivité */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center">
          {isOnline ? (
            <>
              <Wifi className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700 font-medium">En ligne</span>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 font-medium">Hors ligne</span>
            </>
          )}
        </div>
        
        <div className="flex items-center">
          <Cookie className={`h-5 w-5 mr-2 ${isSessionValid() ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-sm ${isSessionValid() ? 'text-green-700' : 'text-red-700'}`}>
            Session {isSessionValid() ? 'valide' : 'invalide'}
          </span>
        </div>
      </div>

      {/* Statut de synchronisation */}
      <div className="space-y-3">
        {syncStatus.isLoading ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin mr-2" />
              <div>
                <div className="text-blue-800 font-medium">Synchronisation en cours...</div>
                <div className="text-blue-600 text-sm">{syncStatus.currentStep}</div>
              </div>
            </div>
            <div className="text-blue-600 font-medium">{Math.round(syncStatus.progress)}%</div>
          </div>
        ) : syncStatus.error ? (
          <div className="flex items-center p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <div className="text-red-800 font-medium">Erreur de synchronisation</div>
              <div className="text-red-600 text-sm">{syncStatus.error}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="text-green-800 font-medium">Données à jour</div>
              <div className="text-green-600 text-sm">
                Dernière sync: {formatDate(syncStatus.lastSync)}
              </div>
            </div>
          </div>
        )}

        {/* Barre de progression */}
        {syncStatus.isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncStatus.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions de session */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>Gestion de session</span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleExtendSession}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Étendre session
            </button>
            
            <button
              onClick={handleClearCache}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Vider cache
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques du cache */}
      {showCacheStats && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Statistiques du cache
          </h4>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{cacheStats.totalEntries}</div>
              <div className="text-gray-600">Entrées</div>
            </div>
            
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{formatBytes(cacheStats.totalSize)}</div>
              <div className="text-gray-600">Taille</div>
            </div>
            
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-red-600">{cacheStats.expiredEntries}</div>
              <div className="text-gray-600">Expirées</div>
            </div>
          </div>
        </div>
      )}

      {/* Détails avancés */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Détails techniques
          </h4>
          
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Empreinte navigateur:</span>
              <span className="font-mono">Sécurisée</span>
            </div>
            
            <div className="flex justify-between">
              <span>Mode hors ligne:</span>
              <span>{!isOnline ? 'Activé' : 'Désactivé'}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Dernière activité:</span>
              <span>{formatDate(Date.now())}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusDisplay;
