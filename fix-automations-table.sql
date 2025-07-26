-- Script de correction de la table automations
-- À exécuter dans le SQL Editor de Supabase
-- https://supabase.com/dashboard/project/knkutxcpjrpcpeicibnf/sql

-- 1. Supprimer la table actuelle et toutes ses dépendances
DROP TABLE IF EXISTS public.automations CASCADE;

-- 2. Créer la nouvelle table avec la structure complète
CREATE TABLE public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'receipt' CHECK (type IN ('receipt', 'rent_review', 'maintenance', 'reminder', 'payment', 'inspection')),
    frequency VARCHAR(50) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'once')),
    next_execution TIMESTAMPTZ,
    last_execution TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    email_template_id UUID,
    document_template_id UUID,
    execution_time TIME DEFAULT '09:00:00',
    
    -- Colonnes pour la compatibilité avec l'ancien système
    trigger_type VARCHAR(50) DEFAULT 'scheduled' CHECK (trigger_type IN ('scheduled', 'event', 'manual')),
    action_type VARCHAR(50) DEFAULT 'email' CHECK (action_type IN ('email', 'document', 'notification', 'webhook')),
    trigger_config JSONB DEFAULT '{}',
    action_config JSONB DEFAULT '{}',
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer les index pour améliorer les performances
CREATE INDEX idx_automations_user_id ON public.automations(user_id);
CREATE INDEX idx_automations_active ON public.automations(active);
CREATE INDEX idx_automations_next_execution ON public.automations(next_execution) WHERE active = true;
CREATE INDEX idx_automations_type ON public.automations(type);
CREATE INDEX idx_automations_frequency ON public.automations(frequency);
CREATE INDEX idx_automations_property_id ON public.automations(property_id);
CREATE INDEX idx_automations_created_at ON public.automations(created_at);

-- 4. Activer Row Level Security (RLS)
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- 5. Créer les policies RLS
CREATE POLICY "Users can view their own automations" ON public.automations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automations" ON public.automations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations" ON public.automations
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations" ON public.automations
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Créer le trigger pour updated_at
CREATE TRIGGER update_automations_updated_at
    BEFORE UPDATE ON public.automations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Créer une fonction pour calculer la prochaine exécution
CREATE OR REPLACE FUNCTION public.calculate_next_execution(
    frequency_val VARCHAR,
    current_time TIMESTAMPTZ DEFAULT NOW(),
    execution_time_val TIME DEFAULT '09:00:00'
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    CASE frequency_val
        WHEN 'daily' THEN
            RETURN (current_time::DATE + INTERVAL '1 day' + execution_time_val)::TIMESTAMPTZ;
        WHEN 'weekly' THEN
            RETURN (current_time::DATE + INTERVAL '1 week' + execution_time_val)::TIMESTAMPTZ;
        WHEN 'monthly' THEN
            RETURN (DATE_TRUNC('month', current_time) + INTERVAL '1 month' + execution_time_val)::TIMESTAMPTZ;
        WHEN 'quarterly' THEN
            RETURN (DATE_TRUNC('quarter', current_time) + INTERVAL '3 months' + execution_time_val)::TIMESTAMPTZ;
        WHEN 'yearly' THEN
            RETURN (DATE_TRUNC('year', current_time) + INTERVAL '1 year' + execution_time_val)::TIMESTAMPTZ;
        WHEN 'once' THEN
            RETURN NULL;
        ELSE
            RETURN (current_time + INTERVAL '1 month')::TIMESTAMPTZ;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 9. Créer un trigger pour calculer automatiquement next_execution lors de l'insertion
CREATE OR REPLACE FUNCTION public.set_next_execution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.next_execution IS NULL AND NEW.frequency != 'once' THEN
        NEW.next_execution = public.calculate_next_execution(
            NEW.frequency,
            NOW(),
            COALESCE(NEW.execution_time, '09:00:00'::TIME)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_automations_next_execution
    BEFORE INSERT ON public.automations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_next_execution();

-- 10. Ajouter des commentaires sur la table et les colonnes
COMMENT ON TABLE public.automations IS 'Table des automatisations utilisateur';
COMMENT ON COLUMN public.automations.id IS 'Identifiant unique de l''automatisation';
COMMENT ON COLUMN public.automations.user_id IS 'Référence vers l''utilisateur propriétaire';
COMMENT ON COLUMN public.automations.name IS 'Nom de l''automatisation';
COMMENT ON COLUMN public.automations.description IS 'Description détaillée de l''automatisation';
COMMENT ON COLUMN public.automations.type IS 'Type d''automatisation (receipt, rent_review, etc.)';
COMMENT ON COLUMN public.automations.frequency IS 'Fréquence d''exécution';
COMMENT ON COLUMN public.automations.next_execution IS 'Prochaine date d''exécution prévue';
COMMENT ON COLUMN public.automations.last_execution IS 'Dernière date d''exécution';
COMMENT ON COLUMN public.automations.active IS 'Indique si l''automatisation est active';
COMMENT ON COLUMN public.automations.property_id IS 'Référence vers la propriété concernée (optionnel)';
COMMENT ON COLUMN public.automations.execution_time IS 'Heure d''exécution (format HH:MM:SS)';
COMMENT ON COLUMN public.automations.trigger_type IS 'Type de déclencheur (scheduled, event, manual)';
COMMENT ON COLUMN public.automations.action_type IS 'Type d''action (email, document, notification)';
COMMENT ON COLUMN public.automations.trigger_config IS 'Configuration JSON du déclencheur';
COMMENT ON COLUMN public.automations.action_config IS 'Configuration JSON de l''action';

-- 11. Insérer des données de test (optionnel - décommentez si nécessaire)
/*
INSERT INTO public.automations (
    user_id,
    name,
    description,
    type,
    frequency,
    active,
    trigger_type,
    action_type,
    trigger_config,
    action_config
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Remplacez par un vrai UUID d'utilisateur
    'Test Automatisation',
    'Automatisation de test pour vérifier la structure',
    'receipt',
    'monthly',
    true,
    'scheduled',
    'email',
    '{"schedule": "monthly"}',
    '{"template": "default"}'
);
*/

-- Fin du script
SELECT 'Table automations créée avec succès !' as status;
