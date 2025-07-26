import { supabase } from './supabase';
import { financialService } from './financialService';
import type {
  BankingConfiguration,
  BankInstitution,
  BankConnection,
  SyncResult
} from '../types/banking';

// Types pour l'API GoCardless
interface GoCardlessEndUserAgreement {
  id: string;
  created: string;
  institution_id: string;
  max_historical_days: number;
  access_valid_for_days: number;
  access_scope: string[];
}

interface GoCardlessRequisition {
  id: string;
  created: string;
  institution_id: string;
  agreement: string;
  accounts: string[];
  user_language: string;
  link: string;
  ssn: string | null;
  account_selection: boolean;
  redirect_immediate: boolean;
  status: string;
}

interface GoCardlessAccountDetails {
  account: {
    resourceId: string;
    iban: string;
    bban: string;
    currency: string;
    name: string;
    product: string;
    cashAccountType: string;
  };
}

interface GoCardlessAccountBalances {
  balances: Array<{
    balanceAmount: {
      amount: string;
      currency: string;
    };
    balanceType: string;
    referenceDate: string;
  }>;
}

interface GoCardlessTransaction {
  transactionId: string;
  bookingDate: string;
  valueDate: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  creditorName?: string;
  debtorName?: string;
  remittanceInformationUnstructured?: string;
  bankTransactionCode?: string;
  proprietaryBankTransactionCode?: string;
}

// Types pour la configuration étendue avec les champs nécessaires
interface ExtendedBankingConfiguration extends BankingConfiguration {
  userId?: string;
  accessToken?: string; // Nouveau: pour compatibilité
  autoSyncEnabled?: boolean;
  syncIntervalHours?: number;
  maxHistoricalDays?: number;
}

// Types pour les catégories de transactions
type TransactionCategoryType = 
  | 'rental_income'
  | 'utilities'
  | 'insurance'
  | 'property_tax'
  | 'maintenance'
  | 'property_management'
  | 'other_income'
  | 'other_expense';

class BankingService {
  private readonly API_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';
  private accessToken: string | null = null;
  
  private configuration: ExtendedBankingConfiguration | null = null;

  constructor() {
    this.loadConfiguration();
  }

  // Configuration Management
  async saveConfiguration(config: ExtendedBankingConfiguration): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Pour la compatibilité, on essaie d'abord avec access_token, sinon on utilise secret_id/secret_key
      try {
        await supabase
          .from('banking_configurations')
          .upsert({
            user_id: user.id,
            access_token: config.goCardlessAccessToken || config.accessToken,
            environment: config.environment,
            auto_sync_enabled: config.autoSyncEnabled || config.autoSync,
            sync_interval_hours: config.syncIntervalHours || (config.syncFrequency === 'daily' ? 24 : 168),
            max_historical_days: config.maxHistoricalDays || 90
          });
      } catch (dbError: any) {
        // Si la colonne access_token n'existe pas, utiliser l'ancienne structure
        if (dbError?.message?.includes('access_token')) {
          await supabase
            .from('banking_configurations')
            .upsert({
              user_id: user.id,
              secret_id: config.goCardlessAccessToken || config.accessToken || 'temp_id',
              secret_key: config.goCardlessAccessToken || config.accessToken || 'temp_key',
              environment: config.environment,
              auto_sync_enabled: config.autoSyncEnabled || config.autoSync,
              sync_interval_hours: config.syncIntervalHours || (config.syncFrequency === 'daily' ? 24 : 168),
              max_historical_days: config.maxHistoricalDays || 90
            });
        } else {
          throw dbError;
        }
      }

      this.configuration = config;
      // Clear tokens when configuration changes
      this.accessToken = null;
    } catch (error) {
      console.error('Error saving banking configuration:', error);
      throw error;
    }
  }

  async loadConfiguration(): Promise<ExtendedBankingConfiguration | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('banking_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Compatibilité avec l'ancienne et la nouvelle structure
        const accessToken = data.access_token || data.secret_id || '';
        
        this.configuration = {
          goCardlessAccessToken: accessToken,
          environment: data.environment,
          defaultCountry: 'FR',
          autoSync: data.auto_sync_enabled,
          syncFrequency: data.sync_interval_hours === 24 ? 'daily' : 'weekly',
          categorizeTransactions: true,
          // Extensions
          userId: data.user_id,
          accessToken: accessToken,
          autoSyncEnabled: data.auto_sync_enabled,
          syncIntervalHours: data.sync_interval_hours,
          maxHistoricalDays: data.max_historical_days
        };
      }

      return this.configuration;
    } catch (error) {
      console.error('Error loading banking configuration:', error);
      throw error;
    }
  }

  // Token Management
  private async getValidToken(): Promise<string> {
    if (!this.configuration) {
      throw new Error('Banking configuration not found');
    }

    // Avec GoCardless, l'access token est persistant et directement utilisable
    if (!this.accessToken) {
      await this.authenticate();
    }

    if (!this.accessToken) {
      throw new Error('Failed to obtain access token');
    }

    return this.accessToken;
  }

  private async authenticate(): Promise<void> {
    if (!this.configuration) {
      throw new Error('Banking configuration not found');
    }

    // Avec le nouveau système GoCardless, l'access token est directement utilisable
    // Plus besoin d'authentification préalable
    const token = this.configuration.goCardlessAccessToken || this.configuration.accessToken;
    
    if (!token) {
      throw new Error('GoCardless access token not found in configuration');
    }

    this.accessToken = token;

    // Test de validité du token avec un appel simple
    try {
      const response = await fetch(`${this.API_BASE_URL}/institutions/`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Access token validation failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Access token validation error:', error);
      throw error;
    }
  }

  // Bank Institutions
  async getInstitutions(country: string = 'FR'): Promise<BankInstitution[]> {
    try {
      const token = await this.getValidToken();
      
      const response = await fetch(`${this.API_BASE_URL}/institutions/?country=${country}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch institutions: ${response.statusText}`);
      }

      const institutions = await response.json();
      
      return institutions.map((inst: any) => ({
        id: inst.id,
        name: inst.name,
        bic: inst.bic,
        country,
        logo: inst.logo,
        maxHistoricalDays: inst.transaction_total_days,
        supportsAccountDetails: true,
        supportsTransactions: true
      }));
    } catch (error) {
      console.error('Error fetching institutions:', error);
      throw error;
    }
  }

  // Bank Connections
  async createConnection(institutionId: string, userId: string): Promise<{ link: string; requisitionId: string }> {
    try {
      const token = await this.getValidToken();
      
      // First create an End User Agreement
      const agreementResponse = await fetch(`${this.API_BASE_URL}/agreements/enduser/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          institution_id: institutionId,
          max_historical_days: this.configuration?.maxHistoricalDays || 90,
          access_valid_for_days: 90,
          access_scope: ['balances', 'details', 'transactions']
        })
      });

      if (!agreementResponse.ok) {
        throw new Error(`Failed to create agreement: ${agreementResponse.statusText}`);
      }

      const agreement: GoCardlessEndUserAgreement = await agreementResponse.json();

      // Then create a requisition
      const requisitionResponse = await fetch(`${this.API_BASE_URL}/requisitions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirect: `${window.location.origin}/finances?tab=banking`,
          institution_id: institutionId,
          agreement: agreement.id,
          user_language: 'FR'
        })
      });

      if (!requisitionResponse.ok) {
        throw new Error(`Failed to create requisition: ${requisitionResponse.statusText}`);
      }

      const requisition: GoCardlessRequisition = await requisitionResponse.json();

      // Save connection to database
      const { error } = await supabase
        .from('bank_connections')
        .insert({
          user_id: userId,
          institution_id: institutionId,
          requisition_id: requisition.id,
          agreement_id: agreement.id,
          status: 'created',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return {
        link: requisition.link,
        requisitionId: requisition.id
      };
    } catch (error) {
      console.error('Error creating bank connection:', error);
      throw error;
    }
  }

  async getConnections(userId: string): Promise<BankConnection[]> {
    try {
      const { data, error } = await supabase
        .from('bank_connections')
        .select(`
          *,
          bank_accounts (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }

  async syncConnection(connectionId: string): Promise<SyncResult> {
    const syncResult: SyncResult = {
      success: false,
      accountsSynced: 0,
      transactionsImported: 0,
      errors: [],
      lastSync: new Date()
    };

    try {
      // Get connection details
      const { data: connection, error: connectionError } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connectionError) throw connectionError;

      const token = await this.getValidToken();

      // Get requisition status
      const requisitionResponse = await fetch(`${this.API_BASE_URL}/requisitions/${connection.requisition_id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!requisitionResponse.ok) {
        throw new Error(`Failed to fetch requisition: ${requisitionResponse.statusText}`);
      }

      const requisition: GoCardlessRequisition = await requisitionResponse.json();

      if (requisition.status !== 'LN') {
        throw new Error(`Connection not ready. Status: ${requisition.status}`);
      }

      // Sync accounts
      for (const accountId of requisition.accounts) {
        try {
          const transactionCount = await this.syncAccount(accountId, connectionId);
          syncResult.accountsSynced++;
          syncResult.transactionsImported += transactionCount;
        } catch (error) {
          console.error(`Error syncing account ${accountId}:`, error);
          syncResult.errors.push(`Account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update connection status
      await supabase
        .from('bank_connections')
        .update({
          status: 'active',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', connectionId);

      syncResult.success = syncResult.errors.length === 0;

    } catch (error) {
      console.error('Error syncing connection:', error);
      syncResult.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return syncResult;
  }

  private async syncAccount(accountId: string, connectionId: string): Promise<number> {
    const token = await this.getValidToken();

    // Get account details
    const detailsResponse = await fetch(`${this.API_BASE_URL}/accounts/${accountId}/details/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!detailsResponse.ok) {
      throw new Error(`Failed to fetch account details: ${detailsResponse.statusText}`);
    }

    const details: GoCardlessAccountDetails = await detailsResponse.json();

    // Get account balances
    const balancesResponse = await fetch(`${this.API_BASE_URL}/accounts/${accountId}/balances/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!balancesResponse.ok) {
      throw new Error(`Failed to fetch account balances: ${balancesResponse.statusText}`);
    }

    const balances: GoCardlessAccountBalances = await balancesResponse.json();

    // Save/update account
    const currentBalance = balances.balances.find(b => b.balanceType === 'interimAvailable')?.balanceAmount.amount || '0';

    const { error: accountError } = await supabase
      .from('bank_accounts')
      .upsert({
        id: accountId,
        connection_id: connectionId,
        iban: details.account.iban,
        name: details.account.name,
        currency: details.account.currency,
        account_type: details.account.cashAccountType,
        current_balance: parseFloat(currentBalance),
        last_sync_at: new Date().toISOString()
      });

    if (accountError) throw accountError;

    // Sync transactions
    return await this.syncAccountTransactions(accountId);
  }

  private async syncAccountTransactions(accountId: string): Promise<number> {
    const token = await this.getValidToken();

    // Get transactions
    const transactionsResponse = await fetch(`${this.API_BASE_URL}/accounts/${accountId}/transactions/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!transactionsResponse.ok) {
      throw new Error(`Failed to fetch transactions: ${transactionsResponse.statusText}`);
    }

    const { transactions } = await transactionsResponse.json();

    // Process transactions
    let count = 0;
    for (const transaction of transactions.booked || []) {
      const wasNew = await this.saveTransaction(accountId, transaction);
      if (wasNew) count++;
    }

    return count;
  }

  private async saveTransaction(accountId: string, transaction: GoCardlessTransaction): Promise<boolean> {
    const amount = parseFloat(transaction.transactionAmount.amount);
    const isIncome = amount > 0;
    
    // Basic categorization
    const category = this.categorizeTransaction(
      transaction.remittanceInformationUnstructured || '',
      transaction.creditorName || transaction.debtorName || '',
      amount
    );

    // Check if transaction already exists
    const { data: existing } = await supabase
      .from('bank_transactions')
      .select('id')
      .eq('transaction_id', transaction.transactionId)
      .single();

    if (existing) return false; // Transaction already synced

    // Save transaction
    const { error } = await supabase
      .from('bank_transactions')
      .insert({
        account_id: accountId,
        transaction_id: transaction.transactionId,
        amount: Math.abs(amount),
        currency: transaction.transactionAmount.currency,
        type: isIncome ? 'income' : 'expense',
        category,
        description: transaction.remittanceInformationUnstructured || '',
        counterpart_name: transaction.creditorName || transaction.debtorName,
        booking_date: transaction.bookingDate,
        value_date: transaction.valueDate,
        bank_transaction_code: transaction.bankTransactionCode,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Try to create corresponding financial flow if it's property-related
    if (this.isPropertyRelated(category)) {
      await this.createFinancialFlow(accountId, transaction, category);
    }

    return true;
  }

  private categorizeTransaction(description: string, counterpart: string, amount: number): TransactionCategoryType {
    const text = `${description} ${counterpart}`.toLowerCase();
    
    // Rental income patterns
    if (text.includes('loyer') || text.includes('rent') || text.includes('bail')) {
      return 'rental_income';
    }
    
    // Property expenses patterns
    if (text.includes('eau') || text.includes('électricité') || text.includes('gaz') || text.includes('edf') || text.includes('veolia')) {
      return 'utilities';
    }
    
    if (text.includes('assurance') || text.includes('insurance')) {
      return 'insurance';
    }
    
    if (text.includes('taxe') || text.includes('impôt') || text.includes('foncière')) {
      return 'property_tax';
    }
    
    if (text.includes('travaux') || text.includes('réparation') || text.includes('maintenance')) {
      return 'maintenance';
    }
    
    if (text.includes('syndic') || text.includes('copropriété') || text.includes('charges')) {
      return 'property_management';
    }
    
    // General categories
    if (amount > 0) {
      return 'other_income';
    } else {
      return 'other_expense';
    }
  }

  private isPropertyRelated(category: TransactionCategoryType): boolean {
    const propertyCategories: TransactionCategoryType[] = [
      'rental_income',
      'utilities',
      'insurance',
      'property_tax',
      'maintenance',
      'property_management'
    ];
    
    return propertyCategories.includes(category);
  }

  private async createFinancialFlow(accountId: string, transaction: GoCardlessTransaction, category: TransactionCategoryType): Promise<void> {
    try {
      const amount = parseFloat(transaction.transactionAmount.amount);
      const isIncome = amount > 0;
      
      // Get user properties to try to match
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, address')
        .eq('user_id', user.id);

      if (!properties || properties.length === 0) return;

      // Try to match property from description
      let propertyId = properties[0].id; // Default to first property
      
      const description = transaction.remittanceInformationUnstructured?.toLowerCase() || '';
      for (const property of properties) {
        if (description.includes(property.title.toLowerCase()) || 
            description.includes(property.address.toLowerCase())) {
          propertyId = property.id;
          break;
        }
      }

      // Create financial flow with banking metadata
      await financialService.createFlow({
        propertyId: propertyId,
        amount: Math.abs(amount),
        type: isIncome ? 'income' : 'expense',
        category: this.mapCategoryToFinancialCategory(category),
        description: transaction.remittanceInformationUnstructured || `Transaction bancaire - ${category}`,
        date: new Date(transaction.bookingDate),
        recurring: false,
        status: 'completed',
        paymentMethod: 'bank_transfer',
        reference: transaction.transactionId,
        metadata: {
          source: 'banking',
          bankTransactionId: transaction.transactionId,
          bankAccountId: accountId,
          counterpartName: transaction.creditorName || transaction.debtorName,
          bankTransactionCode: transaction.bankTransactionCode
        }
      });
    } catch (error) {
      console.error('Error creating financial flow from transaction:', error);
      // Don't throw - this is optional enhancement
    }
  }

  private mapCategoryToFinancialCategory(bankCategory: TransactionCategoryType): string {
    const mapping: Record<TransactionCategoryType, string> = {
      'rental_income': 'loyer',
      'utilities': 'utilities',
      'insurance': 'insurance',
      'property_tax': 'taxes',
      'maintenance': 'maintenance',
      'property_management': 'management',
      'other_income': 'other',
      'other_expense': 'other'
    };
    
    return mapping[bankCategory] || 'other';
  }

  async deleteConnection(connectionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bank_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getValidToken();
      await this.getInstitutions('FR');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Additional convenience methods for compatibility
  getConfiguration(): ExtendedBankingConfiguration | null {
    return this.configuration;
  }

  isConfigured(): boolean {
    return this.configuration !== null && 
           !!(this.configuration.goCardlessAccessToken || this.configuration.accessToken);
  }

  async updateConfiguration(config: ExtendedBankingConfiguration): Promise<void> {
    return this.saveConfiguration(config);
  }

  async getBankConnections(userId?: string): Promise<BankConnection[]> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }
    return this.getConnections(userId);
  }

  async createBankConnection(institutionId: string): Promise<{ link: string; requisitionId: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return this.createConnection(institutionId, user.id);
  }

  async completeBankConnection(requisitionId: string): Promise<void> {
    // Get the connection by requisition ID and sync it
    const { data: connection, error } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('requisition_id', requisitionId)
      .single();

    if (error) throw error;
    if (!connection) throw new Error('Connection not found');

    await this.syncConnection(connection.id);
  }

  async disconnectBank(connectionId: string): Promise<void> {
    return this.deleteConnection(connectionId);
  }

  async syncTransactions(connectionId: string): Promise<SyncResult> {
    return this.syncConnection(connectionId);
  }
}

export const bankingService = new BankingService();
