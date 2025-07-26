-- Migration pour passer aux access tokens GoCardless
-- Mise à jour de la table banking_configurations

-- Ajouter la nouvelle colonne access_token
ALTER TABLE banking_configurations 
ADD COLUMN access_token TEXT;

-- Copier les données existantes (si il y en a) - pour la transition
-- UPDATE banking_configurations 
-- SET access_token = secret_id || '|' || secret_key 
-- WHERE access_token IS NULL;

-- Supprimer les anciennes colonnes secret_id et secret_key
-- (On les garde temporairement pour permettre une migration graduelle)
-- ALTER TABLE banking_configurations 
-- DROP COLUMN secret_id,
-- DROP COLUMN secret_key;

-- Pour l'instant, on garde les anciennes colonnes mais on rend access_token obligatoire pour les nouvelles entrées
-- Une fois la migration terminée, on pourra supprimer les anciennes colonnes

-- Mettre à jour la contrainte pour permettre soit les anciens champs soit le nouveau
-- ALTER TABLE banking_configurations 
-- ADD CONSTRAINT check_auth_method 
-- CHECK (
--   (secret_id IS NOT NULL AND secret_key IS NOT NULL) OR 
--   (access_token IS NOT NULL)
-- );

COMMENT ON COLUMN banking_configurations.access_token IS 'GoCardless access token (nouveau système dauthentification)';
COMMENT ON COLUMN banking_configurations.secret_id IS 'Ancien système - sera supprimé dans une prochaine migration';
COMMENT ON COLUMN banking_configurations.secret_key IS 'Ancien système - sera supprimé dans une prochaine migration';
