-- Script de migration simple pour ajouter la colonne access_token
-- Peut être exécuté directement en SQL si nécessaire

-- Vérifier si la colonne access_token existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'banking_configurations' 
        AND column_name = 'access_token'
    ) THEN
        -- Ajouter la colonne access_token
        ALTER TABLE banking_configurations 
        ADD COLUMN access_token TEXT;
        
        -- Ajouter un commentaire
        COMMENT ON COLUMN banking_configurations.access_token IS 'GoCardless access token (nouveau système dauthentification)';
        
        -- Log de succès
        RAISE NOTICE 'Colonne access_token ajoutée avec succès à banking_configurations';
    ELSE
        RAISE NOTICE 'La colonne access_token existe déjà dans banking_configurations';
    END IF;
END $$;

-- Optionnel: Migrer les données existantes (si nécessaire)
-- UPDATE banking_configurations 
-- SET access_token = 'migrated_' || secret_id 
-- WHERE access_token IS NULL AND secret_id IS NOT NULL;
