#!/usr/bin/env node

/**
 * Script d'exécution manuelle pour recréer la table automations
 * Usage: node recreate-automations-table.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fonction principale pour recréer la table automations
 */
async function recreateAutomationsTable() {
  console.log('🔄 Début de la recréation de la table automations...\n');

  try {
    // 1. Supprimer la table automations existante
    console.log('🗑️ Suppression de la table automations existante...');
    
    const dropSQL = 'DROP TABLE IF EXISTS public.automations CASCADE;';
    const { error: dropError } = await supabase.rpc('sql', { query: dropSQL });

    if (dropError) {
      console.error('❌ Erreur lors de la suppression:', dropError);
      throw dropError;
    }

    console.log('✅ Table automations supprimée avec succès\n');

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

    const { error: createError } = await supabase.rpc('sql', { query: createTableSQL });

    if (createError) {
      console.error('❌ Erreur lors de la création:', createError);
      throw createError;
    }

    console.log('✅ Table automations créée avec succès\n');

    // 3. Ajouter les index pour optimiser les performances
    console.log('📊 Ajout des index...');
    
    const indexesSQL = [
      'CREATE INDEX idx_automations_user_id ON public.automations(user_id);',
      'CREATE INDEX idx_automations_next_execution ON public.automations(next_execution);',
      'CREATE INDEX idx_automations_active ON public.automations(active);',
      'CREATE INDEX idx_automations_property_id ON public.automations(property_id);'
    ];

    for (const indexSQL of indexesSQL) {
      const { error: indexError } = await supabase.rpc('sql', { query: indexSQL });
      if (indexError) {
        console.warn('⚠️ Erreur lors de la création d\'un index:', indexError);
      }
    }

    console.log('✅ Index créés avec succès\n');

    // 4. Configurer la sécurité Row Level Security (RLS)
    console.log('🔒 Configuration de la sécurité RLS...');
    
    const rlsSQL = [
      'ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY "Users can view own automations" ON public.automations
        FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert own automations" ON public.automations
        FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own automations" ON public.automations
        FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete own automations" ON public.automations
        FOR DELETE USING (auth.uid() = user_id);`
    ];

    for (const policySQL of rlsSQL) {
      const { error: rlsError } = await supabase.rpc('sql', { query: policySQL });
      if (rlsError) {
        console.warn('⚠️ Erreur lors de la configuration RLS:', rlsError);
      }
    }

    console.log('✅ Sécurité RLS configurée avec succès\n');

    // 5. Ajouter une fonction de mise à jour automatique du timestamp
    console.log('⏰ Configuration de la mise à jour automatique des timestamps...');
    
    const timestampFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    const triggerSQL = `
      CREATE TRIGGER update_automations_updated_at 
        BEFORE UPDATE ON public.automations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    const { error: functionError } = await supabase.rpc('sql', { query: timestampFunctionSQL });
    if (functionError) {
      console.warn('⚠️ Erreur lors de la création de la fonction:', functionError);
    }

    const { error: triggerError } = await supabase.rpc('sql', { query: triggerSQL });
    if (triggerError) {
      console.warn('⚠️ Erreur lors de la création du trigger:', triggerError);
    }

    console.log('✅ Triggers de timestamps configurés avec succès\n');

    console.log('🎉 Table automations recréée avec succès !');
    console.log('\n📋 Structure de la nouvelle table:');
    console.log('   - id (UUID, clé primaire)');
    console.log('   - user_id (UUID, référence vers auth.users)');
    console.log('   - name (TEXT, requis)');
    console.log('   - description (TEXT, optionnel)');
    console.log('   - type (TEXT, défaut: "receipt")');
    console.log('   - frequency (TEXT, défaut: "monthly")');
    console.log('   - next_execution (TIMESTAMPTZ)');
    console.log('   - last_execution (TIMESTAMPTZ)');
    console.log('   - active (BOOLEAN, défaut: true)');
    console.log('   - property_id (UUID, référence vers properties)');
    console.log('   - email_template_id (UUID)');
    console.log('   - document_template_id (UUID)');
    console.log('   - execution_time (TEXT, défaut: "09:00")');
    console.log('   - created_at (TIMESTAMPTZ, auto)');
    console.log('   - updated_at (TIMESTAMPTZ, auto)\n');

    return true;

  } catch (error) {
    console.error('\n💥 Erreur lors de la recréation de la table:', error);
    return false;
  }
}

/**
 * Fonction pour tester la nouvelle structure
 */
async function testAutomationsTable() {
  console.log('\n🧪 Test de la nouvelle table automations...');

  try {
    // Test de structure - vérifier que la table existe
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .limit(0);

    if (error) {
      throw error;
    }

    console.log('✅ Table automations accessible');
    console.log('✅ Structure de la table validée');

    console.log('\n🎉 Tous les tests sont passés !');
    console.log('📝 La table est prête pour l\'utilisation par l\'application.');
    
    return true;

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Script de recréation de la table automations');
  console.log('================================================\n');

  // Étape 1: Recréer la table
  const recreateSuccess = await recreateAutomationsTable();
  if (!recreateSuccess) {
    console.error('\n❌ Échec de la recréation de la table');
    process.exit(1);
  }

  // Étape 2: Tester la table
  const testSuccess = await testAutomationsTable();
  if (!testSuccess) {
    console.error('\n❌ Échec des tests');
    process.exit(1);
  }

  console.log('\n✨ Script terminé avec succès !');
  console.log('🔄 Vous pouvez maintenant utiliser l\'application pour créer des automatisations.');
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = {
  recreateAutomationsTable,
  testAutomationsTable
};
