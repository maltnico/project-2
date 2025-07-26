// Script de test pour vérifier la connexion Supabase et la structure de la table automations
import { supabase } from './src/lib/supabase.ts';

async function testAutomationService() {
  console.log('🔍 Test de la connexion Supabase et de la table automations...');
  
  try {
    // 1. Tester la connexion utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Erreur utilisateur:', userError);
      return;
    }
    
    if (!user) {
      console.log('⚠️ Aucun utilisateur connecté');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    // 2. Tester la structure de la table
    console.log('🔍 Test de la structure de la table automations...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('automations')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ Erreur lors de l\'accès à la table automations:', tableError);
      return;
    }
    
    console.log('✅ Table automations accessible');
    
    // 3. Tester l'insertion d'une automatisation test
    console.log('🔍 Test d\'insertion d\'une automatisation...');
    
    const testAutomation = {
      user_id: user.id,
      name: 'Test Automatisation',
      description: 'Test de l\'enregistrement',
      type: 'receipt',
      frequency: 'monthly',
      next_execution: new Date().toISOString(),
      active: true,
      execution_time: '09:00',
      trigger_type: 'scheduled',
      action_type: 'email',
      trigger_config: {},
      action_config: {}
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('automations')
      .insert(testAutomation)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion:', insertError);
      
      // Afficher les détails de l'erreur pour le débogage
      if (insertError.details) {
        console.error('📋 Détails:', insertError.details);
      }
      if (insertError.hint) {
        console.error('💡 Conseil:', insertError.hint);
      }
      if (insertError.message) {
        console.error('📝 Message:', insertError.message);
      }
      return;
    }
    
    console.log('✅ Automatisation créée avec succès:', insertData);
    
    // 4. Nettoyer - supprimer l'automatisation test
    const { error: deleteError } = await supabase
      .from('automations')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.error('⚠️ Erreur lors de la suppression du test:', deleteError);
    } else {
      console.log('🧹 Automatisation test supprimée');
    }
    
    console.log('🎉 Tous les tests sont passés !');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

// Exporter pour utilisation en ligne de commande
if (typeof window === 'undefined') {
  testAutomationService();
}

export { testAutomationService };
