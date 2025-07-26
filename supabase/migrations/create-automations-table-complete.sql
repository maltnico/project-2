-- ===============================================
-- Script SQL pour recréer la table automations
-- ===============================================
-- 
-- Instructions d'exécution :
-- 1. Ouvrir Supabase Dashboard > SQL Editor
-- 2. Copier-coller ce script
-- 3. Cliquer sur "Run" pour l'exécuter
-- 
-- Ou via psql :
-- psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f recreate-automations-table.sql
--
-- ===============================================

BEGIN;

-- ===============================================
-- 1. SUPPRESSION DE LA TABLE EXISTANTE
-- ===============================================

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS update_automations_updated_at ON public.automations;

-- Supprimer les policies RLS existantes
DROP POLICY IF EXISTS "Users can view own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can insert own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can update own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can delete own automations" ON public.automations;

-- Supprimer la table (CASCADE supprime automatiquement les contraintes et index)
DROP TABLE IF EXISTS public.automations CASCADE;

-- ===============================================
-- 2. CRÉATION DE LA NOUVELLE TABLE
-- ===============================================

CREATE TABLE public.automations (
    -- Identifiant unique
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Référence vers l'utilisateur (obligatoire)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations de base de l'automatisation
    name TEXT NOT NULL,
    description TEXT,
    
    -- Configuration de l'automatisation
    type TEXT NOT NULL DEFAULT 'receipt' CHECK (type IN ('receipt', 'reminder', 'report', 'notification')),
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    
    -- Planification
    next_execution TIMESTAMPTZ,
    last_execution TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    execution_time TEXT DEFAULT '09:00' CHECK (execution_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
    
    -- Relations optionnelles
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    email_template_id UUID,
    document_template_id UUID,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Contraintes supplémentaires
    CONSTRAINT valid_execution_times CHECK (
        (next_execution IS NULL OR next_execution > created_at) AND
        (last_execution IS NULL OR last_execution <= now())
    )
);

-- ===============================================
-- 3. COMMENTAIRES SUR LA TABLE ET LES COLONNES
-- ===============================================

COMMENT ON TABLE public.automations IS 'Table des automatisations pour la gestion locative';

COMMENT ON COLUMN public.automations.id IS 'Identifiant unique de l''automatisation';
COMMENT ON COLUMN public.automations.user_id IS 'Référence vers l''utilisateur propriétaire';
COMMENT ON COLUMN public.automations.name IS 'Nom de l''automatisation';
COMMENT ON COLUMN public.automations.description IS 'Description détaillée de l''automatisation';
COMMENT ON COLUMN public.automations.type IS 'Type d''automatisation (receipt, reminder, report, notification)';
COMMENT ON COLUMN public.automations.frequency IS 'Fréquence d''exécution (daily, weekly, monthly, yearly)';
COMMENT ON COLUMN public.automations.next_execution IS 'Date/heure de la prochaine exécution';
COMMENT ON COLUMN public.automations.last_execution IS 'Date/heure de la dernière exécution';
COMMENT ON COLUMN public.automations.active IS 'Indique si l''automatisation est active';
COMMENT ON COLUMN public.automations.execution_time IS 'Heure d''exécution au format HH:MM';
COMMENT ON COLUMN public.automations.property_id IS 'Référence optionnelle vers un bien immobilier';
COMMENT ON COLUMN public.automations.email_template_id IS 'Référence optionnelle vers un template d''email';
COMMENT ON COLUMN public.automations.document_template_id IS 'Référence optionnelle vers un template de document';
COMMENT ON COLUMN public.automations.created_at IS 'Date de création de l''automatisation';
COMMENT ON COLUMN public.automations.updated_at IS 'Date de dernière modification';

-- ===============================================
-- 4. INDEX POUR LES PERFORMANCES
-- ===============================================

-- Index sur user_id (le plus utilisé)
CREATE INDEX idx_automations_user_id ON public.automations(user_id);

-- Index sur next_execution pour les tâches planifiées
CREATE INDEX idx_automations_next_execution ON public.automations(next_execution) WHERE active = true;

-- Index sur active pour filtrer rapidement
CREATE INDEX idx_automations_active ON public.automations(active);

-- Index sur property_id pour les recherches par bien
CREATE INDEX idx_automations_property_id ON public.automations(property_id) WHERE property_id IS NOT NULL;

-- Index composé pour les requêtes courantes
CREATE INDEX idx_automations_user_active ON public.automations(user_id, active);

-- Index sur created_at pour le tri
CREATE INDEX idx_automations_created_at ON public.automations(created_at DESC);

-- ===============================================
-- 5. FONCTION DE MISE À JOUR AUTOMATIQUE
-- ===============================================

-- Créer ou remplacer la fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger pour la mise à jour automatique
CREATE TRIGGER update_automations_updated_at 
    BEFORE UPDATE ON public.automations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 6. SÉCURITÉ - ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Activer RLS sur la table
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Policy pour la lecture (SELECT)
CREATE POLICY "Users can view own automations" ON public.automations
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy pour l'insertion (INSERT)
CREATE POLICY "Users can insert own automations" ON public.automations
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy pour la mise à jour (UPDATE)
CREATE POLICY "Users can update own automations" ON public.automations
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy pour la suppression (DELETE)
CREATE POLICY "Users can delete own automations" ON public.automations
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ===============================================
-- 7. DONNÉES DE TEST (OPTIONNEL)
-- ===============================================

-- Insérer des données de test si nécessaire
-- Décommenter les lignes suivantes pour créer des exemples
/*
INSERT INTO public.automations (
    user_id,
    name,
    description,
    type,
    frequency,
    next_execution,
    active,
    execution_time
) VALUES 
(
    auth.uid(), -- Remplacer par un UUID valide si nécessaire
    'Quittance mensuelle',
    'Envoi automatique des quittances de loyer chaque mois',
    'receipt',
    'monthly',
    date_trunc('month', now()) + interval '1 month' + interval '9 hours',
    true,
    '09:00'
),
(
    auth.uid(), -- Remplacer par un UUID valide si nécessaire
    'Rappel échéance',
    'Rappel automatique avant l''échéance du loyer',
    'reminder',
    'monthly',
    date_trunc('month', now()) + interval '1 month' - interval '3 days' + interval '10 hours',
    true,
    '10:00'
);
*/

-- ===============================================
-- 8. VÉRIFICATION FINALE
-- ===============================================

-- Vérifier que la table a été créée correctement
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'automations';

-- Vérifier les colonnes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'automations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'automations';

-- Vérifier les policies RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'automations';

COMMIT;

-- ===============================================
-- FIN DU SCRIPT
-- ===============================================

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table automations recréée avec succès !';
    RAISE NOTICE '📋 Structure : 15 colonnes avec contraintes et validations';
    RAISE NOTICE '📊 Index : 6 index créés pour optimiser les performances';
    RAISE NOTICE '🔒 Sécurité : RLS activé avec 4 policies';
    RAISE NOTICE '⏰ Triggers : Mise à jour automatique des timestamps';
    RAISE NOTICE '🚀 La table est prête pour l''utilisation !';
END $$;
