import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Banknote, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { bankingService } from '../../lib/bankingService';
import type { BankingConfiguration as BankingConfigType } from '../../types/banking';
import { BankingAPITester } from './BankingAPITester';

const BankingConfiguration: React.FC = () => {
  const [config, setConfig] = useState<BankingConfigType | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const currentConfig = bankingService.getConfiguration();
      
      // Si aucune configuration n'existe, créer une configuration par défaut
      if (!currentConfig) {
        const defaultConfig = {
          goCardlessAccessToken: '',
          accessToken: '',
          environment: 'sandbox' as const,
          defaultCountry: 'FR',
          autoSync: false,
          syncFrequency: 'manual' as const,
          categorizeTransactions: true,
          autoSyncEnabled: false,
          syncIntervalHours: 24,
          maxHistoricalDays: 90
        };
        setConfig(defaultConfig);
        setIsConfigured(false);
      } else {
        setConfig(currentConfig);
        setIsConfigured(bankingService.isConfigured());
      }
    } catch (err) {
      console.error('Error loading configuration:', err);
      setError('Erreur lors du chargement de la configuration');
      
      // Fallback: créer une configuration par défaut même en cas d'erreur
      const defaultConfig = {
        goCardlessAccessToken: '',
        accessToken: '',
        environment: 'sandbox' as const,
        defaultCountry: 'FR',
        autoSync: false,
        syncFrequency: 'manual' as const,
        categorizeTransactions: true,
        autoSyncEnabled: false,
        syncIntervalHours: 24,
        maxHistoricalDays: 90
      };
      setConfig(defaultConfig);
      setIsConfigured(false);
    }
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await bankingService.updateConfiguration(config);
      setIsConfigured(bankingService.isConfigured());
      setSuccess('Configuration sauvegardée avec succès');
      setShowApiKeys(false);
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof BankingConfigType, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Banknote className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Configuration bancaire</h2>
            <p className="text-gray-600">Connectez vos comptes bancaires via GoCardless (PSD2)</p>
          </div>
        </div>

        {/* Statut */}
        <div className="flex items-center space-x-2 mb-4">
          {isConfigured ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">Service configuré et prêt</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-amber-700 font-medium">Configuration requise</span>
            </>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}
      </div>

      {/* Configuration GoCardless */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSaveConfiguration} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Access Token GoCardless</h3>
            <button
              type="button"
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showApiKeys ? 'Masquer' : 'Afficher'} le token
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type={showApiKeys ? 'text' : 'password'}
                value={config.goCardlessAccessToken}
                onChange={(e) => handleConfigChange('goCardlessAccessToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre Access Token GoCardless (ex: live_xxx... ou sandbox_xxx...)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: <code>sandbox_xxx...</code> pour les tests ou <code>live_xxx...</code> pour la production
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environnement
              </label>
              <select
                value={config.environment}
                onChange={(e) => handleConfigChange('environment', e.target.value as 'sandbox' | 'production')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sandbox">Sandbox (Test)</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays par défaut
              </label>
              <select
                value={config.defaultCountry}
                onChange={(e) => handleConfigChange('defaultCountry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FR">France</option>
                <option value="DE">Allemagne</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
                <option value="GB">Royaume-Uni</option>
              </select>
            </div>
          </div>

          {/* Paramètres de synchronisation */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-base font-medium text-gray-900 mb-4">Paramètres de synchronisation</h4>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={config.autoSync}
                  onChange={(e) => handleConfigChange('autoSync', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoSync" className="ml-2 block text-sm text-gray-900">
                  Synchronisation automatique
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence de synchronisation
                </label>
                <select
                  value={config.syncFrequency}
                  onChange={(e) => handleConfigChange('syncFrequency', e.target.value)}
                  disabled={!config.autoSync}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="manual">Manuelle uniquement</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="categorizeTransactions"
                  checked={config.categorizeTransactions}
                  onChange={(e) => handleConfigChange('categorizeTransactions', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="categorizeTransactions" className="ml-2 block text-sm text-gray-900">
                  Catégorisation automatique des transactions
                </label>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={loadConfiguration}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              <span>Sauvegarder</span>
            </button>
          </div>
        </form>
      </div>

      {/* Informations sur GoCardless */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <CreditCard className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Comment obtenir votre Access Token GoCardless ?</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Inscrivez-vous sur <a href="https://gocardless.com/bank-account-data/" target="_blank" rel="noopener noreferrer" className="underline">GoCardless Bank Account Data</a></li>
              <li>Accédez à votre tableau de bord développeur</li>
              <li>Générez votre Access Token (remplace les anciennes clés Secret ID/Key)</li>
              <li>Commencez avec l'environnement Sandbox pour tester (token commence par <code>sandbox_</code>)</li>
              <li>Passez en Production avec un token live (commence par <code>live_</code>)</li>
            </ol>
            <p className="text-sm text-blue-700 mt-3">
              <strong>Gratuit</strong> jusqu'à 100 connexions/mois • Conforme PSD2 • 2000+ banques supportées
            </p>
          </div>
        </div>
      </div>

      {/* Testeur d'API */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h4 className="font-medium text-gray-900 mb-4">Tester vos identifiants API</h4>
        <p className="text-sm text-gray-600 mb-4">
          Utilisez cet outil pour vérifier que vos identifiants GoCardless sont corrects avant de les sauvegarder.
        </p>
        <BankingAPITester />
      </div>
    </div>
  );
};

export default BankingConfiguration;
