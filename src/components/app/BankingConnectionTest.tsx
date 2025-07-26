import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader } from 'lucide-react';

const BankingConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResults([]);
    setError(null);

    const tests = [
      {
        name: 'Test des clés API',
        test: testApiCredentials
      },
      {
        name: 'Test de génération de token',
        test: testTokenGeneration
      },
      {
        name: 'Test récupération institutions',
        test: testInstitutions
      }
    ];

    const testResults = [];

    for (const test of tests) {
      try {
        const result = await test.test();
        testResults.push({
          name: test.name,
          status: 'success',
          result: result,
          error: null
        });
      } catch (error) {
        testResults.push({
          name: test.name,
          status: 'error',
          result: null,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
      setResults([...testResults]);
    }

    setTesting(false);
  };

  const testApiCredentials = async () => {
    const SECRET_ID = '809e97c1-183b-461e-9d4b-23de4f0fed81';
    const SECRET_KEY = '1abb091813e84e92becaee723ceb8198d3f45bce21b5b76ea8c9711b32a6a5a57939f8f4740bad30f09e2c1c43f36b76256dd9ca80c864bc9976c2c60958e067';
    
    return {
      secretId: SECRET_ID.substring(0, 8) + '...',
      secretKey: SECRET_KEY.substring(0, 8) + '...',
      valid: SECRET_ID.length > 0 && SECRET_KEY.length > 0
    };
  };

  const testTokenGeneration = async () => {
    console.log('Attempting to generate token via proxy...');

    try {
      const response = await fetch('http://localhost:3001/api/gocardless/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Token response status:', response.status);
      console.log('Token response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token generation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(`HTTP ${response.status} (${response.statusText}): ${errorData.error || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Token generation success:', data);
      
      // Sauvegarder le token comme le fait le service
      localStorage.setItem('banking_config', JSON.stringify({
        accessToken: data.access,
        environment: 'sandbox',
        userId: 'local-user',
        tokenExpiry: Date.now() + (data.access_expires * 1000)
      }));
      
      return {
        status: response.status,
        hasAccessToken: !!data.access,
        tokenType: data.token_type,
        expiresIn: data.access_expires,
        refreshExpiresIn: data.refresh_expires,
        tokenLength: data.access ? data.access.length : 0
      };
    } catch (error) {
      console.error('Network or other error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erreur de connexion au serveur proxy - Vérifiez que le serveur est démarré sur le port 3001');
      }
      throw error;
    }
  };

  const testInstitutions = async () => {
    // D'abord générer un token
    const tokenResult = await testTokenGeneration();
    if (!tokenResult.hasAccessToken) {
      throw new Error('Pas de token d\'accès disponible');
    }

    // Récupérer le token depuis le localStorage
    const config = JSON.parse(localStorage.getItem('banking_config') || '{}');
    if (!config.accessToken) {
      throw new Error('Token non trouvé dans le stockage local');
    }

    const response = await fetch('http://localhost:3001/api/gocardless/institutions?country=FR', {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      status: response.status,
      institutionCount: data.results?.length || 0,
      institutions: data.results?.slice(0, 5).map((inst: any) => inst.name) || []
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Test de connexion GoCardless</h3>
        <button
          onClick={testConnection}
          disabled={testing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {testing ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>{testing ? 'Test en cours...' : 'Lancer le test'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{result.name}</h4>
              {result.status === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            {result.error ? (
              <div className="text-red-700 text-sm bg-red-50 p-2 rounded">
                {result.error}
              </div>
            ) : (
              <div className="text-gray-700 text-sm bg-gray-50 p-2 rounded">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankingConnectionTest;
