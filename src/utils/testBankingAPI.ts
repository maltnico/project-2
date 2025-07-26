// Test de l'API GoCardless avec le token sandbox
// Utilisez ce script pour vérifier que votre token fonctionne

const API_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';
const SANDBOX_TOKEN = 'sandbox_eFuTUSa27UQazMxbcBLcbnFAgw7WnPldRGjlr9vN';

async function testGoCardlessAPI() {
  console.log('🧪 Test de l\'API GoCardless...');
  
  try {
    // Test 1: Obtenir un token d'accès
    console.log('1️⃣ Test d\'authentification...');
    const tokenResponse = await fetch(`${API_BASE_URL}/token/new/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret_id: SANDBOX_TOKEN,
        secret_key: SANDBOX_TOKEN
      })
    });

    if (!tokenResponse.ok) {
      console.error('❌ Échec de l\'authentification:', tokenResponse.status, tokenResponse.statusText);
      const errorText = await tokenResponse.text();
      console.error('Détails:', errorText);
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Authentification réussie!');
    console.log('Token d\'accès obtenu:', tokenData.access.substring(0, 20) + '...');

    // Test 2: Récupérer les institutions françaises
    console.log('2️⃣ Test de récupération des banques françaises...');
    const institutionsResponse = await fetch(`${API_BASE_URL}/institutions/?country=FR`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access}`,
        'Accept': 'application/json'
      }
    });

    if (!institutionsResponse.ok) {
      console.error('❌ Échec de récupération des institutions:', institutionsResponse.status);
      return;
    }

    const institutions = await institutionsResponse.json();
    console.log('✅ Institutions récupérées:', institutions.length, 'banques françaises');
    console.log('Exemples:', institutions.slice(0, 3).map((i: any) => i.name));

    console.log('🎉 Tests réussis! L\'API GoCardless fonctionne correctement.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exportation pour utilisation dans l'application
export { testGoCardlessAPI, SANDBOX_TOKEN };
