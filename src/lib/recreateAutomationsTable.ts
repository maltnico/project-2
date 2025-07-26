import { supabase } from './supabase';

/**
 * Script pour recréer la table automations avec la bonne structure
 * Utilise l'API Supabase pour exécuter des requêtes SQL brutes
 */
export async function recreateAutomationsTable() {
  console.log('🔄 Début de la recréation de la table automations...');

  try {
    // 1. Supprimer la table automations existante
    console.log('🗑️ Suppression de la table automations existante...');
    
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'DROP TABLE IF EXISTS public.automations CASCADE;'
    });

    if (dropError) {
      console.error('❌ Erreur lors de la suppression:', dropError);
      throw dropError;
    }

    console.log('✅ Table automations supprimée avec succès');

    // 2. Créer la nouvelle table avec la bonne structure
    console.log('🔨 Création de la nouvelle table automations...');
    
    const createTableSQL = `
      CREATE TABLE public.automations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'receipt',
        frequency TEXT NOT NULL DEFAULT 'monthly',
        next_execution TIMESTAMPTZ,
        last_execution TIMESTAMPTZ,
        active BOOLEAN NOT NULL DEFAULT true,
        property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
        email_template_id UUID,
        document_template_id UUID,
        execution_time TEXT DEFAULT '09:00',
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `;

    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.error('❌ Erreur lors de la création:', createError);
      throw createError;
    }

    console.log('✅ Table automations créée avec succès');

    // 3. Ajouter les index pour optimiser les performances
    console.log('📊 Ajout des index...');
    
    const indexesSQL = `
      CREATE INDEX idx_automations_user_id ON public.automations(user_id);
      CREATE INDEX idx_automations_next_execution ON public.automations(next_execution);
      CREATE INDEX idx_automations_active ON public.automations(active);
      CREATE INDEX idx_automations_property_id ON public.automations(property_id);
    `;

    const { error: indexError } = await supabase.rpc('execute_sql', {
      sql: indexesSQL
    });

    if (indexError) {
      console.warn('⚠️ Erreur lors de la création des index:', indexError);
      // Les index ne sont pas critiques, on continue
    } else {
      console.log('✅ Index créés avec succès');
    }

    // 4. Configurer la sécurité Row Level Security (RLS)
    console.log('🔒 Configuration de la sécurité RLS...');
    
    const rlsSQL = `
      ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view own automations" ON public.automations
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert own automations" ON public.automations
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update own automations" ON public.automations
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete own automations" ON public.automations
        FOR DELETE USING (auth.uid() = user_id);
    `;

    const { error: rlsError } = await supabase.rpc('execute_sql', {
      sql: rlsSQL
    });

    if (rlsError) {
      console.error('❌ Erreur lors de la configuration RLS:', rlsError);
      throw rlsError;
    }

    console.log('✅ Sécurité RLS configurée avec succès');

    // 5. Ajouter une fonction de mise à jour automatique du timestamp
    console.log('⏰ Configuration de la mise à jour automatique des timestamps...');
    
    const timestampSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      CREATE TRIGGER update_automations_updated_at 
        BEFORE UPDATE ON public.automations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    const { error: timestampError } = await supabase.rpc('execute_sql', {
      sql: timestampSQL
    });

    if (timestampError) {
      console.warn('⚠️ Erreur lors de la configuration des timestamps:', timestampError);
      // Les triggers ne sont pas critiques, on continue
    } else {
      console.log('✅ Triggers de timestamps configurés avec succès');
    }

    console.log('🎉 Table automations recréée avec succès !');
    
    return {
      success: true,
      message: 'Table automations recréée avec succès'
    };

  } catch (error) {
    console.error('💥 Erreur lors de la recréation de la table:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Fonction pour tester la nouvelle structure
 */
export async function testAutomationsTable() {
  console.log('🧪 Test de la nouvelle table automations...');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    // Test d'insertion
    const testAutomation = {
      user_id: user.id,
      name: 'Test Automatisation',
      description: 'Test de la nouvelle structure',
      type: 'receipt',
      frequency: 'monthly',
      next_execution: new Date().toISOString(),
      active: true,
      execution_time: '09:00'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('automations')
      .insert(testAutomation)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Test d\'insertion réussi:', insertData);

    // Test de lecture
    const { data: selectData, error: selectError } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', user.id);

    if (selectError) {
      throw selectError;
    }

    console.log('✅ Test de lecture réussi:', selectData);

    // Nettoyer - supprimer les données de test
    const { error: deleteError } = await supabase
      .from('automations')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️ Erreur lors du nettoyage:', deleteError);
    } else {
      console.log('🧹 Données de test nettoyées');
    }

    console.log('🎉 Tous les tests sont passés !');
    
    return {
      success: true,
      message: 'Tests de la table automations réussis'
    };

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    return {
      success: false,
      error: error
    };
  }
}
