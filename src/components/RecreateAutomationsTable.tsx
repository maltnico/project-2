import { useState } from 'react';
import { supabase } from '../lib/supabase';

const RecreateAutomationsTable = () => {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const recreateTable = async () => {
    setIsLoading(true);
    setStatus('🔄 Début de la recréation de la table automations...');

    try {
      // 1. Supprimer la table existante
      setStatus('🗑️ Suppression de la table automations existante...');
      
      const dropTableSQL = `DROP TABLE IF EXISTS public.automations CASCADE;`;
      
      const { error: dropError } = await supabase.rpc('sql', {
        query: dropTableSQL
      });

      if (dropError) {
        console.log('Erreur lors de la suppression:', dropError);
      }

      // 2. Créer la nouvelle table
      setStatus('🏗️ Création de la nouvelle table automations...');
      
      const createTableSQL = `
        CREATE TABLE public.automations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL DEFAULT 'receipt',
          frequency TEXT NOT NULL DEFAULT 'monthly',
          next_execution TIMESTAMPTZ,
          last_execution TIMESTAMPTZ,
          active BOOLEAN DEFAULT true,
          property_id UUID,
          email_template_id UUID,
          document_template_id UUID,
          execution_time TEXT DEFAULT '09:00',
          trigger_type TEXT DEFAULT 'scheduled',
          action_type TEXT DEFAULT 'email',
          trigger_config JSONB DEFAULT '{}',
          action_config JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      const { error: createError } = await supabase.rpc('sql', {
        query: createTableSQL
      });

      if (createError) {
        setStatus(`❌ Erreur lors de la création: ${createError.message}`);
        return;
      }

      // 3. Créer les index
      setStatus('📊 Création des index...');
      
      const indexSQL = `
        CREATE INDEX idx_automations_user_id ON public.automations(user_id);
        CREATE INDEX idx_automations_next_execution ON public.automations(next_execution);
        CREATE INDEX idx_automations_active ON public.automations(active);
      `;

      await supabase.rpc('sql', { query: indexSQL });

      // 4. Activer RLS
      setStatus('🔒 Configuration de la sécurité RLS...');
      
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

      await supabase.rpc('sql', { query: rlsSQL });

      // 5. Créer le trigger pour updated_at
      setStatus('⚡ Création du trigger updated_at...');
      
      const triggerSQL = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_automations_updated_at 
          BEFORE UPDATE ON public.automations 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;

      await supabase.rpc('sql', { query: triggerSQL });

      // 6. Test d'insertion
      setStatus('🧪 Test d\'insertion...');
      
      const testAutomation = {
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
        setStatus(`❌ Erreur lors du test: ${insertError.message}`);
        return;
      }

      // 7. Nettoyer le test
      await supabase
        .from('automations')
        .delete()
        .eq('id', insertData.id);

      setStatus('🎉 Table automations recréée avec succès !');

    } catch (error) {
      setStatus(`💥 Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Recréer la table Automations</h2>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <p className="text-yellow-800">
            ⚠️ <strong>Attention :</strong> Cette opération va supprimer toutes les automatisations existantes 
            et recréer la table avec la bonne structure.
          </p>
        </div>

        <button
          onClick={recreateTable}
          disabled={isLoading}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'En cours...' : 'Recréer la table'}
        </button>

        {status && (
          <div className="bg-gray-50 border rounded p-4 mt-4">
            <h3 className="font-semibold mb-2">Statut :</h3>
            <pre className="text-sm whitespace-pre-wrap">{status}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecreateAutomationsTable;
