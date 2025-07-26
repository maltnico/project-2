// Script de débogage pour le processus de création d'automatisation
// À exécuter dans la console du navigateur de votre application

console.log('🔍 Débogage de la création d\'automatisation...');

// Fonction de test
async function debugAutomationCreation() {
  try {
    console.log('1. Vérification de l\'importation du service...');
    
    // Essayer d'importer le service
    const { automationService } = await import('./src/lib/automationService.ts');
    console.log('✅ Service importé avec succès');
    
    console.log('2. Vérification de l\'authentification...');
    
    // Test d'authentification
    const { supabase } = await import('./src/lib/supabase.ts');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError);
      return;
    }
    
    if (!user) {
      console.log('❌ Aucun utilisateur connecté. Connectez-vous d\'abord.');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    console.log('3. Test de création d\'automatisation...');
    
    // Données de test
    const testAutomation = {
      name: 'Test Debug Automatisation',
      description: 'Automatisation de test pour le débogage',
      type: 'receipt',
      frequency: 'monthly',
      nextExecution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
      active: true,
      executionTime: '09:00'
    };
    
    console.log('📤 Données à envoyer:', testAutomation);
    
    // Tentative de création
    const createdAutomation = await automationService.createAutomation(testAutomation);
    
    console.log('✅ Automatisation créée avec succès !');
    console.log('📋 Détails:', createdAutomation);
    
    console.log('4. Vérification de la persistance...');
    
    // Vérifier que l'automatisation a bien été sauvegardée
    const automations = await automationService.getAll();
    const foundAutomation = automations.find(a => a.id === createdAutomation.id);
    
    if (foundAutomation) {
      console.log('✅ Automatisation trouvée dans la base !');
      console.log('📋 Automatisation persistée:', foundAutomation);
    } else {
      console.log('❌ Automatisation non trouvée dans la base après création');
    }
    
    console.log('5. Nettoyage - Suppression de l\'automatisation test...');
    
    // Supprimer l'automatisation test
    const deleted = await automationService.deleteAutomation(createdAutomation.id);
    
    if (deleted) {
      console.log('✅ Automatisation test supprimée');
    } else {
      console.log('⚠️  Erreur lors de la suppression de l\'automatisation test');
    }
    
    console.log('🎉 Test de débogage terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
    
    // Diagnostic spécifique des erreurs
    if (error.message.includes('permission denied')) {
      console.log('💡 Problème de permissions RLS. Vérifiez que les policies sont correctes.');
    } else if (error.message.includes('violates check constraint')) {
      console.log('💡 Violation de contrainte. Vérifiez les valeurs des champs.');
    } else if (error.message.includes('null value in column')) {
      console.log('💡 Valeur manquante dans une colonne obligatoire.');
    } else if (error.message.includes('relation "public.automations" does not exist')) {
      console.log('💡 La table automations n\'existe pas.');
    }
    
    console.log('🔍 Stack trace:', error.stack);
  }
}

// Fonction de diagnostic des policies RLS
async function checkRLSPolicies() {
  try {
    console.log('🔍 Vérification des policies RLS...');
    
    const { supabase } = await import('./src/lib/supabase.ts');
    
    // Test direct d'insertion (bypass du service)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté');
      return;
    }
    
    const testData = {
      user_id: user.id,
      name: 'Test RLS Policy',
      description: 'Test des policies',
      type: 'receipt',
      frequency: 'monthly',
      next_execution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      execution_time: '09:00',
      trigger_type: 'scheduled',
      action_type: 'email',
      trigger_config: {},
      action_config: {}
    };
    
    console.log('📤 Test d\'insertion directe:', testData);
    
    const { data, error } = await supabase
      .from('automations')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur d\'insertion:', error);
    } else {
      console.log('✅ Insertion réussie:', data);
      
      // Nettoyer
      await supabase.from('automations').delete().eq('id', data.id);
      console.log('✅ Nettoyage effectué');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test RLS:', error);
  }
}

// Exporter les fonctions
window.debugAutomationCreation = debugAutomationCreation;
window.checkRLSPolicies = checkRLSPolicies;

console.log('📋 Scripts de débogage prêts !');
console.log('🚀 Tapez: debugAutomationCreation()');
console.log('🔒 Ou: checkRLSPolicies()');
