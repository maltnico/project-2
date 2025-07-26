-- Migration pour recréer la table automations avec la bonne structure
-- Date: 26 juillet 2025

-- 1. Sauvegarder les données existantes (si la table existe)
CREATE TABLE IF NOT EXISTS automations_backup AS 
SELECT * FROM automations WHERE false; -- Structure seulement, pas de données

-- 2. Supprimer la table existante
DROP TABLE IF EXISTS automations CASCADE;

-- 3. Créer la nouvelle table avec la structure correcte
CREATE TABLE automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'receipt',
    frequency TEXT NOT NULL DEFAULT 'monthly',
    next_execution TIMESTAMPTZ,
    last_execution TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    property_id UUID,
    email_template_id UUID,
    document_template_id UUID,
    execution_time TEXT DEFAULT '09:00',
    
    -- Colonnes héritées pour compatibilité
    trigger_type TEXT DEFAULT 'scheduled',
    action_type TEXT DEFAULT 'email',
    trigger_config JSONB DEFAULT '{}',
    action_config JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Créer les index pour optimiser les performances
CREATE INDEX idx_automations_user_id ON automations(user_id);
CREATE INDEX idx_automations_active ON automations(active);
CREATE INDEX idx_automations_next_execution ON automations(next_execution);
CREATE INDEX idx_automations_property_id ON automations(property_id);

-- 5. Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_automations_updated_at 
    BEFORE UPDATE ON automations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Activer RLS (Row Level Security)
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS
CREATE POLICY "Users can view their own automations" ON automations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automations" ON automations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations" ON automations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations" ON automations
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Ajouter des contraintes de validation
ALTER TABLE automations ADD CONSTRAINT check_frequency 
    CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly'));

ALTER TABLE automations ADD CONSTRAINT check_type 
    CHECK (type IN ('receipt', 'reminder', 'report', 'maintenance'));

ALTER TABLE automations ADD CONSTRAINT check_execution_time_format
    CHECK (execution_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$');

-- 9. Nettoyer la table de sauvegarde
DROP TABLE IF EXISTS automations_backup;

-- 10. Commenter la table et les colonnes importantes
COMMENT ON TABLE automations IS 'Table des automatisations utilisateur pour EasyBail';
COMMENT ON COLUMN automations.user_id IS 'ID de l\'utilisateur propriétaire de l\'automatisation';
COMMENT ON COLUMN automations.name IS 'Nom de l\'automatisation';
COMMENT ON COLUMN automations.type IS 'Type d\'automatisation (receipt, reminder, report, maintenance)';
COMMENT ON COLUMN automations.frequency IS 'Fréquence d\'exécution (daily, weekly, monthly, yearly)';
COMMENT ON COLUMN automations.next_execution IS 'Prochaine date d\'exécution prévue';
COMMENT ON COLUMN automations.execution_time IS 'Heure d\'exécution au format HH:MM';
