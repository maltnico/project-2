// Test de diagnostic pour la table automations
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (remplacez par vos vraies valeurs)
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

// Test de connexion simple
async function testConnection() {
  try {
    console.log('🔍 Test de connexion Supabase...');
    
    // Créer le client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Vérifier l'authentification
    console.log('1. Test de l\'utilisateur connecté...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError);
      return;
    }
    
    if (!user) {
      console.log('⚠️  Aucun utilisateur connecté');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    // Test 2: Vérifier l'existence de la table
    console.log('2. Test de la table automations...');
    const { data: tables, error: tableError } = await supabase
      .from('automations')
      .select('count(*)', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('❌ Erreur avec la table automations:', tableError);
      if (tableError.message.includes('relation "public.automations" does not exist')) {
        console.log('💡 La table automations n\'existe pas. Il faut l\'exécuter le script SQL.');
      }
      return;
    }
    
    console.log('✅ Table automations accessible');
    
    // Test 3: Récupérer les automatisations existantes
    console.log('3. Test de récupération des données...');
    const { data: automations, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', user.id);
    
    if (fetchError) {
      console.error('❌ Erreur lors de la récupération:', fetchError);
      return;
    }
    
    console.log('✅ Automatisations récupérées:', automations?.length || 0);
    
    // Test 4: Créer une automatisation test
    console.log('4. Test de création...');
    const testData = {
      user_id: user.id,
      name: 'Test Automatisation',
      description: 'Test de création',
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
    
    const { data: created, error: createError } = await supabase
      .from('automations')
      .insert(testData)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erreur lors de la création:', createError);
      return;
    }
    
    console.log('✅ Automatisation créée:', created);
    
    // Test 5: Supprimer l'automatisation test
    console.log('5. Test de suppression...');
    const { error: deleteError } = await supabase
      .from('automations')
      .delete()
      .eq('id', created.id);
    
    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      return;
    }
    
    console.log('✅ Automatisation supprimée');
    console.log('🎉 Tous les tests sont passés !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exporter pour utilisation
export { testConnection };
