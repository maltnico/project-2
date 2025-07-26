// Test de connexion pour la table automations
// À exécuter dans la console du navigateur (F12 > Console)

async function testAutomationsTable() {
  console.log('🔍 Test de la table automations...');
  
  try {
    // Import du service d'automatisation
    const { automationService } = await import('./src/lib/automationService.ts');
    
    console.log('✅ Service d\'automatisation importé');
    
    // Test 1: Récupération des automatisations
    console.log('🔍 Test de récupération des automatisations...');
    const automations = await automationService.getAll();
    console.log('✅ Récupération réussie:', automations.length, 'automatisations trouvées');
    
    // Test 2: Création d'une automatisation test
    console.log('🔍 Test de création d\'automatisation...');
    const testAutomation = {
      name: 'Test Automatisation',
      description: 'Test de la nouvelle structure',
      type: 'receipt',
      frequency: 'monthly',
      nextExecution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
      active: true,
      executionTime: '09:00'
    };
    
    const createdAutomation = await automationService.createAutomation(testAutomation);
    console.log('✅ Création réussie:', createdAutomation);
    
    // Test 3: Suppression de l'automatisation test
    console.log('🔍 Suppression de l\'automatisation test...');
    const deleted = await automationService.deleteAutomation(createdAutomation.id);
    console.log('✅ Suppression réussie:', deleted);
    
    console.log('🎉 Tous les tests sont passés ! La table automations fonctionne parfaitement.');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    
    // Diagnostics supplémentaires
    if (error.message.includes('relation "public.automations" does not exist')) {
      console.log('💡 La table automations n\'existe pas. Exécutez le script SQL de création.');
    } else if (error.message.includes('permission denied')) {
      console.log('💡 Problème de permissions. Vérifiez les policies RLS.');
    } else if (error.message.includes('violates check constraint')) {
      console.log('💡 Violation de contrainte. Vérifiez les données envoyées.');
    }
  }
}

// Exporter la fonction pour utilisation
window.testAutomationsTable = testAutomationsTable;

console.log('📋 Test prêt ! Tapez: testAutomationsTable()');
