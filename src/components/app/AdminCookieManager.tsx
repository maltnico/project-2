/**
 * Composant d'administration pour la gestion des cookies et sessions
 */

import React, { useState, useEffect } from 'react';
import { 
  Cookie, 
  Settings, 
  Trash2, 
  RefreshCw, 
  Shield, 
  Clock, 
  Database,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { cookieManager } from '../../lib/cookieManager';
import { dataSyncService } from '../../lib/dataSyncService';

const AdminCookieManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'cache' | 'security'>('overview');
  const [cacheStats, setCacheStats] = useState(cookieManager.getCacheStats());
  const [sessionValid, setSessionValid] = useState(cookieManager.isSessionValid());
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(cookieManager.getCacheStats());
      setSessionValid(cookieManager.isSessionValid());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearCache = () => {
    try {
      cookieManager.clearAllCache();
      setCacheStats(cookieManager.getCacheStats());
      showNotification('success', 'Cache vidé avec succès');
    } catch {
      showNotification('error', 'Erreur lors du vidage du cache');
    }
  };

  const handleClearSession = () => {
    try {
      cookieManager.clearSession();
      setSessionValid(false);
      showNotification('success', 'Session supprimée avec succès');
    } catch {
      showNotification('error', 'Erreur lors de la suppression de la session');
    }
  };

  const handleForceRefresh = () => {
    try {
      dataSyncService.scheduleFullRefresh();
      showNotification('success', 'Rechargement programmé pour la prochaine connexion');
    } catch {
      showNotification('error', 'Erreur lors de la programmation du rechargement');
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        cacheStats,
        sessionValid,
        timestamp: new Date().toISOString(),
        localStorage: { ...localStorage }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `easybail-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification('success', 'Données exportées avec succès');
    } catch {
      showNotification('error', 'Erreur lors de l\'exportation');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Cookie },
    { id: 'sessions', label: 'Sessions', icon: Shield },
    { id: 'cache', label: 'Cache', icon: Database },
    { id: 'security', label: 'Sécurité', icon: Settings }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Cookie className="h-6 w-6 mr-2 text-blue-600" />
              Gestion des Cookies & Sessions
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Administration des cookies, sessions et cache de l'application
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> :
           notification.type === 'error' ? <AlertTriangle className="h-5 w-5 mr-2" /> :
           <Clock className="h-5 w-5 mr-2" />}
          {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'sessions' | 'cache' | 'security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Session</p>
                    <p className={`text-2xl font-bold ${sessionValid ? 'text-green-600' : 'text-red-600'}`}>
                      {sessionValid ? 'Valide' : 'Invalide'}
                    </p>
                  </div>
                  <Shield className={`h-8 w-8 ${sessionValid ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache</p>
                    <p className="text-2xl font-bold text-blue-600">{cacheStats.totalEntries}</p>
                    <p className="text-xs text-gray-500">entrées</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taille</p>
                    <p className="text-2xl font-bold text-purple-600">{formatBytes(cacheStats.totalSize)}</p>
                    <p className="text-xs text-gray-500">stockées</p>
                  </div>
                  <Database className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleClearCache}
                  className="p-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Vider le cache
                </button>
                
                <button
                  onClick={handleClearSession}
                  className="p-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Supprimer session
                </button>
                
                <button
                  onClick={handleForceRefresh}
                  className="p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Forcer rechargement
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Gestion des sessions</h3>
              <button
                onClick={() => setShowSessionDetails(!showSessionDetails)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              >
                {showSessionDetails ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">État de la session</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sessionValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {sessionValid ? 'Active' : 'Inactive'}
                </span>
              </div>

              {showSessionDetails && sessionValid && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type de session:</span>
                    <span className="font-medium">Cookie sécurisé</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dernière activité:</span>
                    <span className="font-medium">{new Date().toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Empreinte:</span>
                    <span className="font-medium font-mono">Sécurisée</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleClearSession}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Terminer session
              </button>
            </div>
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Gestion du cache</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{cacheStats.totalEntries}</div>
                <div className="text-sm text-blue-700">Entrées totales</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{formatBytes(cacheStats.totalSize)}</div>
                <div className="text-sm text-green-700">Taille totale</div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-900">{cacheStats.expiredEntries}</div>
                <div className="text-sm text-red-700">Entrées expirées</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Actions de maintenance</h4>
              <div className="space-y-3">
                <button
                  onClick={handleClearCache}
                  className="w-full p-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Vider tout le cache
                </button>
                
                <button
                  onClick={() => {
                    cookieManager.cleanupExpiredData();
                    setCacheStats(cookieManager.getCacheStats());
                    showNotification('success', 'Données expirées nettoyées');
                  }}
                  className="w-full p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Nettoyer les données expirées
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Paramètres de sécurité</h3>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Configuration des cookies
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">SameSite:</span>
                  <span className="font-medium">Lax</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Secure:</span>
                  <span className="font-medium">{window.location.protocol === 'https:' ? 'Activé' : 'Désactivé'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HttpOnly:</span>
                  <span className="font-medium">Simulé</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expiration:</span>
                  <span className="font-medium">24h (ou 30j si "Se souvenir")</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Recommandations de sécurité</h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    <li>• Les sessions sont chiffrées localement</li>
                    <li>• L'empreinte du navigateur est vérifiée</li>
                    <li>• Les données expirées sont automatiquement nettoyées</li>
                    <li>• Le rechargement des données est forcé à chaque connexion</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCookieManager;
