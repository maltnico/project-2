// Script pour recréer la table automations avec la service role key
const supabaseUrl = 'https://knkutxcpjrpcpeicibnf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua3V0eGNwanJwY3BlaWNpYm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI3MDYyMSwiZXhwIjoyMDY4ODQ2NjIxfQ.HimYQ0p311dqCVNS6pxxOfdf3zl28UTOEg341MyAAtA';

console.log('🔨 Ajout des colonnes manquantes à la table automations...');

async function addMissingColumns() {
  try {
    console.log('1. Vérification de la structure actuelle...');
    
    // Vérifier d'abord quelles colonnes existent
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/automations?select=*&limit=0`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!testResponse.ok) {
      console.error('❌ Impossible d\'accéder à la table automations');
      return;
    }
    
    console.log('✅ Table accessible');
    
    console.log('2. Ajout des colonnes manquantes...');
    
    // Utiliser une fonction PostgreSQL pour ajouter les colonnes
    const alterTableSQL = `
      -- Ajouter les colonnes manquantes si elles n'existent pas
      DO $$ 
      BEGIN
        -- trigger_config
        BEGIN
          ALTER TABLE public.automations ADD COLUMN trigger_config jsonb DEFAULT '{}' NOT NULL;
          RAISE NOTICE 'Colonne trigger_config ajoutée';
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'Colonne trigger_config existe déjà';
        END;
        
        -- action_config
        BEGIN
          ALTER TABLE public.automations ADD COLUMN action_config jsonb DEFAULT '{}' NOT NULL;
          RAISE NOTICE 'Colonne action_config ajoutée';
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'Colonne action_config existe déjà';
        END;
        
        -- trigger_type
        BEGIN
          ALTER TABLE public.automations ADD COLUMN trigger_type text DEFAULT 'scheduled' NOT NULL;
          RAISE NOTICE 'Colonne trigger_type ajoutée';
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'Colonne trigger_type existe déjà';
        END;
        
        -- action_type
        BEGIN
          ALTER TABLE public.automations ADD COLUMN action_type text DEFAULT 'email' NOT NULL;
          RAISE NOTICE 'Colonne action_type ajoutée';
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'Colonne action_type existe déjà';
        END;
        
        RAISE NOTICE 'Colonnes vérifiées/ajoutées avec succès';
      END $$;
    `;
    
    // Utiliser l'endpoint function pour exécuter le SQL
    const addColumnsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/add_automation_columns`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    // Si la fonction n'existe pas, on va créer les colonnes une par une
    if (addColumnsResponse.status === 404) {
      console.log('3. Tentative d\'ajout des colonnes via des requêtes directes...');
      
      // Essayer d'ajouter chaque colonne individuellement
      const columns = [
        { name: 'trigger_config', type: 'jsonb', default: "'{}'" },
        { name: 'action_config', type: 'jsonb', default: "'{}'" },
        { name: 'trigger_type', type: 'text', default: "'scheduled'" },
        { name: 'action_type', type: 'text', default: "'email'" }
      ];
      
      for (const column of columns) {
        try {
          console.log(`   Ajout de la colonne ${column.name}...`);
          
          // Test si la colonne existe en essayant de la sélectionner
          const testCol = await fetch(`${supabaseUrl}/rest/v1/automations?select=${column.name}&limit=1`, {
            method: 'GET',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (testCol.ok) {
            console.log(`   ✅ Colonne ${column.name} existe déjà`);
          } else {
            console.log(`   ❌ Colonne ${column.name} manquante - impossible d'ajouter via API REST`);
          }
        } catch (error) {
          console.log(`   ⚠️  Erreur pour ${column.name}:`, error.message);
        }
      }
    } else if (addColumnsResponse.ok) {
      console.log('✅ Colonnes ajoutées via fonction PostgreSQL');
    } else {
      const error = await addColumnsResponse.text();
      console.log('⚠️  Réponse:', error);
    }
    
    console.log('4. Test de création d\'une automatisation...');
    
    // Tester avec des données minimales
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID test
      name: 'Test Colonnes',
      type: 'receipt',
      frequency: 'monthly',
      next_execution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      execution_time: '09:00'
    };
    
    const createTest = await fetch(`${supabaseUrl}/rest/v1/automations`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });
    
    if (createTest.ok) {
      const created = await createTest.json();
      console.log('✅ Test de création réussi:', created[0]?.id);
      
      // Supprimer le test
      await fetch(`${supabaseUrl}/rest/v1/automations?id=eq.${created[0]?.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Données de test nettoyées');
    } else {
      const error = await createTest.text();
      console.log('❌ Erreur lors du test de création:', error);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la mise à jour
addMissingColumns();
