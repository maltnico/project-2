import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Save, 
  TestTube, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Loader2,
  Key,
  Server,
  Lock,
  Unlock
} from 'lucide-react';
import { mailService, MailConfig } from '../../lib/mailService';

const VaultMailConfig: React.FC = () => {
  const [config, setConfig] = useState<MailConfig>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    from: '',
    replyTo: '',
    enabled: false,
    provider: 'other'
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [vaultConnected, setVaultConnected] = useState(false);
  const [useVault, setUseVault] = useState(true);

  useEffect(() => {
    loadConfiguration();
    checkVaultConnection();
  }, []);

  const checkVaultConnection = async () => {
    try {
      const isConnected = await mailService.testVaultConnection();
      setVaultConnected(isConnected);
      if (!isConnected) {
        setUseVault(false);
      }
    } catch (error) {
      console.error('Erreur test vault:', error);
      setVaultConnected(false);
      setUseVault(false);
    }
  };

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Essayer d'abord le vault si disponible
      let loadedConfig = null;
      if (vaultConnected) {
        loadedConfig = await mailService.getConfigFromVault();
      }

      // Fallback sur localStorage
      if (!loadedConfig) {
        loadedConfig = mailService.getConfig();
      }

      if (loadedConfig) {
        setConfig(loadedConfig);
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseInt(value) || 0 : value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (useVault && vaultConnected) {
        // Sauvegarder dans le vault
        await mailService.saveConfigToVault(config);
        setSuccess('Configuration sauvegardée dans le vault sécurisé');
      } else {
        // Sauvegarder localement
        mailService.saveConfig(config);
        setSuccess('Configuration sauvegardée localement');
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      // Sauvegarder temporairement la config pour le test
      if (useVault && vaultConnected) {
        await mailService.saveConfigToVault(config);
      } else {
        mailService.saveConfig(config);
      }

      const result = await mailService.verifyConnection();
      
      if (result.success) {
        setSuccess('✅ Connexion SMTP réussie !');
      } else {
        setError(`❌ Échec de la connexion: ${result.error}`);
      }
    } catch (err) {
      console.error('Erreur lors du test:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du test de connexion');
    } finally {
      setTesting(false);
    }
  };

  const getProviderConfig = (provider: string) => {
    const configs = {
      ovh: { host: 'ssl0.ovh.net', port: 465, secure: true },
      gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
      outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
      sendgrid: { host: 'smtp.sendgrid.net', port: 587, secure: false },
      mailgun: { host: 'smtp.mailgun.org', port: 587, secure: false }
    };
    return configs[provider as keyof typeof configs];
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value;
    const providerConfig = getProviderConfig(provider);
    
    setConfig(prev => ({
      ...prev,
      provider: provider as MailConfig['provider'],
      ...(providerConfig && {
        host: providerConfig.host,
        port: providerConfig.port,
        secure: providerConfig.secure
      })
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec statut du vault */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuration Mail Sécurisée</h1>
              <p className="text-gray-600 mt-1">
                Configurez votre serveur SMTP avec stockage sécurisé dans le vault
              </p>
            </div>
          </div>
          
          {/* Statut du vault */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
              vaultConnected ? 'bg-green-100 text-green-800 border border-green-200' : 
              'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {vaultConnected ? (
                <>
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Vault connecté</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Vault indisponible</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      {/* Options de stockage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Mode de stockage
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                checked={useVault && vaultConnected}
                onChange={() => setUseVault(true)}
                disabled={!vaultConnected}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-900">Vault sécurisé</span>
                <span className="text-sm text-gray-500">(Recommandé - Chiffrement des mots de passe)</span>
              </div>
            </label>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                checked={!useVault}
                onChange={() => setUseVault(false)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <Unlock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-gray-900">Stockage local</span>
                <span className="text-sm text-gray-500">(Non chiffré - Pour tests uniquement)</span>
              </div>
            </label>
          </div>
          
          {!vaultConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ Le vault n'est pas disponible. La configuration sera stockée localement sans chiffrement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire de configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Server className="h-5 w-5 mr-2" />
          Configuration SMTP
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fournisseur */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fournisseur de service
            </label>
            <select
              name="provider"
              value={config.provider}
              onChange={handleProviderChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="other">Autre / Configuration manuelle</option>
              <option value="ovh">OVH</option>
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook / Hotmail</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
            </select>
          </div>

          {/* Serveur SMTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serveur SMTP *
            </label>
            <input
              type="text"
              name="host"
              value={config.host}
              onChange={handleInputChange}
              placeholder="smtp.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Port *
            </label>
            <input
              type="number"
              name="port"
              value={config.port}
              onChange={handleInputChange}
              placeholder="587"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* SSL/TLS */}
          <div className="lg:col-span-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="secure"
                checked={config.secure}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Utiliser SSL/TLS (port 465) ou STARTTLS (port 587)
              </span>
            </label>
          </div>

          {/* Nom d'utilisateur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur *
            </label>
            <input
              type="text"
              name="username"
              value={config.username}
              onChange={handleInputChange}
              placeholder="votre@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe *
              {useVault && vaultConnected && (
                <span className="ml-2 text-xs text-green-600">(Sera chiffré dans le vault)</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={config.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Email d'envoi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email d'envoi *
            </label>
            <input
              type="email"
              name="from"
              value={config.from}
              onChange={handleInputChange}
              placeholder="noreply@votre-domaine.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Email de réponse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de réponse
            </label>
            <input
              type="email"
              name="replyTo"
              value={config.replyTo}
              onChange={handleInputChange}
              placeholder="support@votre-domaine.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Service activé */}
          <div className="lg:col-span-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="enabled"
                checked={config.enabled}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Activer le service d'envoi d'emails
              </span>
            </label>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleTest}
            disabled={testing || !config.host || !config.username || !config.password}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Tester la connexion
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !config.host || !config.username || !config.password}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder{useVault && vaultConnected ? ' dans le vault' : ' localement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VaultMailConfig;
