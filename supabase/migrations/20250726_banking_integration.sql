-- Banking Integration Migration-- Ajoute les tables nécessaires pour l'intégration bancaire avec GoCardless-- Table de configuration bancaireCREATE TABLE IF NOT EXISTS banking_configurations (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  secret_id TEXT NOT NULL,  secret_key TEXT NOT NULL,  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),  auto_sync_enabled BOOLEAN DEFAULT true,  sync_interval_hours INTEGER DEFAULT 24,  max_historical_days INTEGER DEFAULT 90,  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  UNIQUE(user_id));-- Table des connexions bancairesCREATE TABLE IF NOT EXISTS bank_connections (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  institution_id TEXT NOT NULL,  institution_name TEXT,  requisition_id TEXT NOT NULL,  agreement_id TEXT NOT NULL,  status TEXT NOT NULL CHECK (status IN ('created', 'active', 'expired', 'error')),  last_sync_at TIMESTAMP WITH TIME ZONE,  expires_at TIMESTAMP WITH TIME ZONE,  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());-- Table des comptes bancairesCREATE TABLE IF NOT EXISTS bank_accounts (  id TEXT PRIMARY KEY, -- GoCardless account ID  connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,  iban TEXT NOT NULL,  name TEXT NOT NULL,  currency TEXT NOT NULL DEFAULT 'EUR',  account_type TEXT,  current_balance DECIMAL(12,2) DEFAULT 0,  last_sync_at TIMESTAMP WITH TIME ZONE,  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());-- Table des transactions bancairesCREATE TABLE IF NOT EXISTS bank_transactions (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  account_id TEXT NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,  transaction_id TEXT NOT NULL UNIQUE, -- GoCardless transaction ID  amount DECIMAL(12,2) NOT NULL,  currency TEXT NOT NULL DEFAULT 'EUR',  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),  category TEXT,  description TEXT,  counterpart_name TEXT,  booking_date DATE NOT NULL,  value_date DATE,  bank_transaction_code TEXT,  metadata JSONB,  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());-- Indexes pour améliorer les performancesCREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);CREATE INDEX IF NOT EXISTS idx_bank_connections_status ON bank_connections(status);CREATE INDEX IF NOT EXISTS idx_bank_accounts_connection_id ON bank_accounts(connection_id);CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON bank_transactions(account_id);CREATE INDEX IF NOT EXISTS idx_bank_transactions_booking_date ON bank_transactions(booking_date);CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions(type);CREATE INDEX IF NOT EXISTS idx_bank_transactions_category ON bank_transactions(category);-- RLS (Row Level Security) policiesALTER TABLE banking_configurations ENABLE ROW LEVEL SECURITY;ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;-- Policies pour banking_configurationsCREATE POLICY "Users can view own banking configuration" ON banking_configurations  FOR SELECT USING (auth.uid() = user_id);CREATE POLICY "Users can insert own banking configuration" ON banking_configurations  FOR INSERT WITH CHECK (auth.uid() = user_id);CREATE POLICY "Users can update own banking configuration" ON banking_configurations  FOR UPDATE USING (auth.uid() = user_id);CREATE POLICY "Users can delete own banking configuration" ON banking_configurations
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour bank_connections
CREATE POLICY "Users can view own bank connections" ON bank_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank connections" ON bank_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank connections" ON bank_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank connections" ON bank_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour bank_accounts
CREATE POLICY "Users can view own bank accounts" ON bank_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bank_connections 
      WHERE bank_connections.id = bank_accounts.connection_id 
      AND bank_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_connections 
      WHERE bank_connections.id = bank_accounts.connection_id 
      AND bank_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own bank accounts" ON bank_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bank_connections 
      WHERE bank_connections.id = bank_accounts.connection_id 
      AND bank_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own bank accounts" ON bank_accounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bank_connections 
      WHERE bank_connections.id = bank_accounts.connection_id 
      AND bank_connections.user_id = auth.uid()
    )
  );

-- Policies pour bank_transactions
CREATE POLICY "Users can view own bank transactions" ON bank_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      JOIN bank_connections ON bank_connections.id = bank_accounts.connection_id
      WHERE bank_accounts.id = bank_transactions.account_id 
      AND bank_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own bank transactions" ON bank_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      JOIN bank_connections ON bank_connections.id = bank_accounts.connection_id
      WHERE bank_accounts.id = bank_transactions.account_id 
      AND bank_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own bank transactions" ON bank_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      JOIN bank_connections ON bank_connections.id = bank_accounts.connection_id
      WHERE bank_accounts.id = bank_transactions.account_id 
      AND bank_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own bank transactions" ON bank_transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      JOIN bank_connections ON bank_connections.id = bank_accounts.connection_id
      WHERE bank_accounts.id = bank_transactions.account_id 
      AND bank_connections.user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_banking_configurations_updated_at 
  BEFORE UPDATE ON banking_configurations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_connections_updated_at 
  BEFORE UPDATE ON bank_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at 
  BEFORE UPDATE ON bank_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at 
  BEFORE UPDATE ON bank_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ajouter une colonne metadata à la table financial_flows si elle n'existe pas déjà
-- pour permettre de lier les transactions bancaires aux flux financiers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='financial_flows' AND column_name='metadata'
  ) THEN
    ALTER TABLE financial_flows ADD COLUMN metadata JSONB;
  END IF;
END $$;
