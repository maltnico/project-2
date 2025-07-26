-- Migration pour mettre à jour la structure de la table automations
-- pour correspondre à la structure utilisée dans l'application

-- Ajouter les colonnes manquantes pour la structure utilisée dans l'app
ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS frequency text,
ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS email_template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS document_template_id text,
ADD COLUMN IF NOT EXISTS execution_time text DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Renommer les colonnes pour correspondre à la structure de l'app
ALTER TABLE automations 
RENAME COLUMN is_active TO is_active_old;

ALTER TABLE automations 
RENAME COLUMN last_run_at TO last_execution;

ALTER TABLE automations 
RENAME COLUMN next_run_at TO next_execution;

-- Migrer les données si nécessaire
UPDATE automations SET active = is_active_old WHERE active IS NULL;

-- Supprimer l'ancienne colonne
ALTER TABLE automations DROP COLUMN IF EXISTS is_active_old;

-- Ajouter des contraintes pour les nouveaux champs
ALTER TABLE automations 
ADD CONSTRAINT automations_type_check 
CHECK (type IN ('receipt', 'rent_review', 'insurance', 'notice', 'maintenance', 'reminder'));

ALTER TABLE automations 
ADD CONSTRAINT automations_frequency_check 
CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS automations_user_id_idx ON automations (user_id);
CREATE INDEX IF NOT EXISTS automations_active_idx ON automations (active);
CREATE INDEX IF NOT EXISTS automations_next_execution_idx ON automations (next_execution);
CREATE INDEX IF NOT EXISTS automations_type_idx ON automations (type);

-- Mettre à jour les politiques RLS
DROP POLICY IF EXISTS "Users can view own automations" ON automations;
DROP POLICY IF EXISTS "Users can insert own automations" ON automations;
DROP POLICY IF EXISTS "Users can update own automations" ON automations;
DROP POLICY IF EXISTS "Users can delete own automations" ON automations;

CREATE POLICY "Users can view own automations" ON automations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own automations" ON automations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own automations" ON automations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own automations" ON automations FOR DELETE TO authenticated USING (auth.uid() = user_id);
