import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const BankingAPITester: React.FC = () => {
  const [accessToken, setAccessToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testCredentials = async () => {
    if (!accessToken.trim()) {
      setResult({
        success: false,
        message: 'Veuillez entrer un access token'
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      // Test simple avec l'API GoCardless - liste des institutions
      const response = await fetch('https://bankaccountdata.gocardless.com/api/v2/institutions/?country=FR', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          success: true,
          message: `✅ Access token valide ! ${data.length || 0} institutions trouvées.`,
          details: {
            institutions_count: data.length,
            environment: accessToken.startsWith('sandbox_') ? 'sandbox' : 'production'
          }
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setResult({
          success: false,
          message: `❌ Erreur d'authentification: ${response.status} ${response.statusText}`,
          details: errorData
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Access Token GoCardless
        </label>
        <input
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="sandbox_xxx... ou live_xxx..."
        />
      </div>

      <button
        onClick={testCredentials}
        disabled={testing || !accessToken.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
      >
        {testing ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span>{testing ? 'Test en cours...' : 'Tester les identifiants'}</span>
      </button>

      {result && (
        <div className={`p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
              {result.details && (
                <pre className={`text-xs mt-2 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};