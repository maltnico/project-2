// Vérifier la structure de la table automations
console.log('🔍 Vérification de la structure de la table automations...');

const supabaseUrl = 'https://knkutxcpjrpcpeicibnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua3V0eGNwanJwY3BlaWNpYm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzA2MjEsImV4cCI6MjA2ODg0NjYyMX0.zz6Ey1u-6qB7bG7aln41l-vvyNJlCEABaDCgbs3jB9g';

// Test simple pour voir quelles colonnes existent
const testUrl = `${supabaseUrl}/rest/v1/automations?select=*&limit=0`;

fetch(testUrl, {
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📊 Status:', response.status);
  console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
  return response.json();
})
.then(data => {
  console.log('📊 Réponse:', data);
  console.log('✅ La table existe et est accessible');
})
.catch(error => {
  console.error('❌ Erreur:', error);
});
