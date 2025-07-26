import { localBankingStorage } from './localBankingStorage';
import type {
  BankInstitution,
  BankConnection,
  SyncResult,
  BankAccount,
  BankTransaction
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

// Liste des banques de la sandbox GoCardless
const SANDBOX_INSTITUTIONS: BankInstitution[] = [
  {
    id: 'SANDBOXFINANCE_SFIN0000',
    name: 'Sandbox Finance',
    bic: 'SFIN0000',
    country: 'FR',
    logo: 'https://cdn.nordigen.com/ais/SANDBOXFINANCE_SFIN0000.png',
    maxHistoricalDays: 90,
    supportsAccountDetails: true,
    supportsTransactions: true
  },
  {
    id: 'REVOLUT_REVOFR21',
    name: 'Revolut',
    bic: 'REVOFR21',
    country: 'FR',
    maxHistoricalDays: 90,
    supportsAccountDetails: true,
    supportsTransactions: true
  },
  {
    id: 'CREDIT_AGRICOLE_AGRIFRPP',
    name: 'Crédit Agricole',
    bic: 'AGRIFRPP',
    country: 'FR',
    maxHistoricalDays: 90,
    supportsAccountDetails: true,
    supportsTransactions: true
  },
  {
    id: 'BNP_PARIBAS_BNPAFRPP',
    name: 'BNP Paribas',
    bic: 'BNPAFRPP',
    country: 'FR',
    maxHistoricalDays: 90,
    supportsAccountDetails: true,
    supportsTransactions: true
  },
  {
    id: 'SOCIETE_GENERALE_SOGEFRPP',
    name: 'Société Générale',
    bic: 'SOGEFRPP',
    country: 'FR',
    maxHistoricalDays: 90,
    supportsAccountDetails: true,
    supportsTransactions: true
  },
  {
    id: 'LCL_LYCLFRPP',
    name: 'LCL - Le Crédit Lyonnais',
    bic: 'LYCLFRPP',
    country: 'FR',
    maxHistoricalDays: 90,
    supportsAccountDetails: true,
    supportsTransactions: true
  },
  {
    id: 'BOURSORAMA_BOUSFRPP',
    name: 'Boursorama Banque',
    bic: 'BOUSFRPP',
    country: 'FR',
    maxHistoricalDays: 90,
    supportsAccountDetails: true,
    supportsTransactions: true
  }
];

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
  private readonly API_BASE_URL = 'http://localhost:3001/api/gocardless';
  private accessToken: string | null = null;

  constructor() {
    // Charger le token existant s'il est encore valide
    this.loadExistingToken();
  }

  // Token Management
  private loadExistingToken(): void {
    try {
      const config = localBankingStorage.getConfig();
      if (config?.accessToken && config.tokenExpiry && Date.now() < config.tokenExpiry) {
        this.accessToken = config.accessToken;
      }
    } catch (error) {
      console.error('Error loading existing token:', error);
    }
  }

  private async initializeToken(): Promise<void> {
    if (!this.accessToken) {
      try {
        // Obtenir un token d'accès avec les clés API
        await this.generateAccessToken();
      } catch (error) {
        console.error('Error initializing banking service:', error);
        throw error;
      }
    }
  }

  private async generateAccessToken(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate access token: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access;
      
      // Sauvegarder le token localement avec une expiration
      localBankingStorage.saveConfig({
        accessToken: this.accessToken!,
        environment: 'sandbox',
        userId: 'local-user',
        tokenExpiry: Date.now() + (data.access_expires * 1000) // Convertir en millisecondes
      });
    } catch (error) {
      console.error('Error generating access token:', error);
      throw error;
    }
  }

  private async getValidToken(): Promise<string> {
    // Si on n'a pas de token, on essaie d'en obtenir un
    await this.initializeToken();

    // Test de validité du token avec un appel simple
    try {
      const response = await fetch(`${this.API_BASE_URL}/institutions?country=FR`, {
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

    return this.accessToken!;
  }

  // Bank Institutions - Utilise la liste sandbox locale
  async getInstitutions(country: string = 'FR'): Promise<BankInstitution[]> {
    try {
      // Pour la sandbox, on retourne notre liste prédéfinie
      const config = localBankingStorage.getConfig();
      if (!config || config.environment === 'sandbox') {
        return SANDBOX_INSTITUTIONS.filter(inst => inst.country === country);
      }

      // Pour l'environnement live, on interroge l'API via le proxy
      const token = await this.getValidToken();
      
      const response = await fetch(`${this.API_BASE_URL}/institutions?country=${country}`, {
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
      // En cas d'erreur, retourner la liste sandbox comme fallback
      return SANDBOX_INSTITUTIONS.filter(inst => inst.country === country);
    }
  }

  // Bank Connections - Stockage local
  async createConnection(institutionId: string, userId: string = 'local-user'): Promise<{ link: string; requisitionId: string }> {
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
          max_historical_days: 90,
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

      // Save connection to local storage
      const connection: BankConnection = {
        id: `conn_${Date.now()}`,
        userId: userId,
        institutionId: institutionId,
        institutionName: SANDBOX_INSTITUTIONS.find(i => i.id === institutionId)?.name || 'Unknown Bank',
        requisitionId: requisition.id,
        agreementId: agreement.id,
        status: 'created',
        accounts: [],
        createdAt: new Date(),
        lastSync: undefined,
        isActive: true,
        metadata: {
          requisition_id: requisition.id,
          agreement_id: agreement.id
        }
      };

      localBankingStorage.saveConnection(connection);

      return {
        link: requisition.link,
        requisitionId: requisition.id
      };
    } catch (error) {
      console.error('Error creating bank connection:', error);
      throw error;
    }
  }

  async getConnections(userId: string = 'local-user'): Promise<BankConnection[]> {
    try {
      return localBankingStorage.getConnections().filter(conn => conn.userId === userId);
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
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
      // Get connection details from local storage
      const connections = localBankingStorage.getConnections();
      const connection = connections.find(c => c.id === connectionId);
      if (!connection) throw new Error('Connection not found');

      // Si sandbox, on utilise les paiements GoCardless comme transactions
      const config = localBankingStorage.getConfig();
      if (config?.environment === 'sandbox') {
        const payments = await this.fetchGoCardlessPayments();
        // On crée un compte fictif si besoin
        let account = localBankingStorage.getAccounts().find(a => a.institutionId === connection.institutionId);
        if (!account) {
          account = {
            id: `sandbox_acc_${Date.now()}`,
            name: connection.institutionName,
            iban: '',
            bic: '',
            currency: payments[0]?.currency || 'EUR',
            institutionId: connection.institutionId,
            institutionName: connection.institutionName,
            accountType: 'checking',
            balance: { current: 0, currency: payments[0]?.currency || 'EUR' },
            lastSync: new Date(),
            isActive: true,
            metadata: { sandbox: true }
          };
          localBankingStorage.saveAccount(account);
        }
        // Enregistre les paiements comme transactions
        if (account) {
          payments.forEach(tx => {
            tx.accountId = account!.id;
          });
          localBankingStorage.saveTransactions(payments);
          syncResult.accountsSynced = 1;
          syncResult.transactionsImported = payments.length;
          syncResult.success = true;
          connection.status = 'active';
          connection.lastSync = new Date();
          localBankingStorage.saveConnection(connection);
        }
        return syncResult;
      }
      // Get requisition status
      const token = await this.getValidToken();

      const requisitionResponse = await fetch(`${this.API_BASE_URL}/requisitions/${connection.requisitionId}/`, {
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

      // Update connection status in local storage
      connection.status = 'active';
      connection.lastSync = new Date();
      localBankingStorage.saveConnection(connection);

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

    // Save/update account in local storage
    const currentBalance = balances.balances.find(b => b.balanceType === 'interimAvailable')?.balanceAmount.amount || '0';

    const account: BankAccount = {
      id: accountId,
      name: details.account.name,
      iban: details.account.iban,
      bic: details.account.bban || '',
      currency: details.account.currency,
      institutionId: '',
      institutionName: '',
      accountType: this.mapAccountType(details.account.cashAccountType),
      balance: {
        current: parseFloat(currentBalance),
        currency: details.account.currency
      },
      lastSync: new Date(),
      isActive: true,
      metadata: {
        connectionId: connectionId,
        resourceId: details.account.resourceId,
        product: details.account.product
      }
    };

    localBankingStorage.saveAccount(account);

    // Sync transactions
    return await this.syncAccountTransactions(accountId);
  }

  private mapAccountType(cashAccountType: string): 'checking' | 'savings' | 'credit' | 'other' {
    switch (cashAccountType?.toLowerCase()) {
      case 'current':
      case 'checking':
        return 'checking';
      case 'savings':
        return 'savings';
      case 'credit':
        return 'credit';
      default:
        return 'other';
    }
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
    const newTransactions: BankTransaction[] = [];

    for (const transaction of transactions.booked || []) {
      const amount = parseFloat(transaction.transactionAmount.amount);
      const isIncome = amount > 0;
      
      const category = this.categorizeTransaction(
        transaction.remittanceInformationUnstructured || '',
        transaction.creditorName || transaction.debtorName || '',
        amount
      );

      // Check if transaction already exists
      const existingTransactions = localBankingStorage.getTransactions();
      const exists = existingTransactions.some(t => 
        t.metadata?.bankTransactionId === transaction.transactionId
      );

      if (!exists) {
        const bankTransaction: BankTransaction = {
          id: `tx_${transaction.transactionId}_${Date.now()}`,
          accountId: accountId,
          amount: Math.abs(amount),
          currency: transaction.transactionAmount.currency,
          date: new Date(transaction.bookingDate),
          valueDate: transaction.valueDate ? new Date(transaction.valueDate) : undefined,
          description: transaction.remittanceInformationUnstructured || '',
          reference: transaction.transactionId,
          category: category,
          counterpartyName: transaction.creditorName || transaction.debtorName,
          counterpartyAccount: '',
          type: isIncome ? 'credit' : 'debit',
          status: 'completed',
          metadata: {
            bankTransactionId: transaction.transactionId,
            bankTransactionCode: transaction.bankTransactionCode,
            source: 'gocardless'
          }
        };

        newTransactions.push(bankTransaction);
        count++;
      }
    }

    if (newTransactions.length > 0) {
      localBankingStorage.saveTransactions(newTransactions);
    }

    return count;
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

  async deleteConnection(connectionId: string): Promise<void> {
    try {
      localBankingStorage.deleteConnection(connectionId);
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

  // Synchroniser toutes les connexions automatiquement
  async syncAllConnections(): Promise<{ totalConnections: number; successfulSyncs: number; errors: string[] }> {
    const connections = localBankingStorage.getConnections();
    const results = {
      totalConnections: connections.length,
      successfulSyncs: 0,
      errors: [] as string[]
    };

    console.log(`🔄 Synchronisation de ${connections.length} connexion(s) bancaire(s)...`);

    for (const connection of connections) {
      try {
        console.log(`🏦 Synchronisation de ${connection.institutionName}...`);
        const syncResult = await this.syncConnection(connection.id);
        
        if (syncResult.success) {
          results.successfulSyncs++;
          console.log(`✅ ${connection.institutionName}: ${syncResult.accountsSynced} compte(s), ${syncResult.transactionsImported} transaction(s)`);
        } else {
          results.errors.push(`${connection.institutionName}: ${syncResult.errors.join(', ')}`);
          console.error(`❌ ${connection.institutionName}: ${syncResult.errors.join(', ')}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        results.errors.push(`${connection.institutionName}: ${errorMessage}`);
        console.error(`❌ ${connection.institutionName}: ${errorMessage}`);
      }
    }

    console.log(`📊 Synchronisation terminée: ${results.successfulSyncs}/${results.totalConnections} succès`);
    return results;
  }

  // Méthode pour synchroniser automatiquement à intervalles réguliers
  startAutoSync(intervalMinutes: number = 60): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    console.log(`🔄 Synchronisation automatique activée (toutes les ${intervalMinutes} minutes)`);
    
    this.autoSyncInterval = setInterval(async () => {
      try {
        console.log('🔄 Synchronisation automatique en cours...');
        await this.syncAllConnections();
      } catch (error) {
        console.error('Erreur lors de la synchronisation automatique:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('⏹️ Synchronisation automatique arrêtée');
    }
  }

  // Méthode pour vérifier et compléter les connexions en attente
  async checkPendingConnections(): Promise<void> {
    const connections = localBankingStorage.getConnections();
    const pendingConnections = connections.filter(c => c.status === 'created' || c.status === 'connected');

    for (const connection of pendingConnections) {
      try {
        if (connection.requisitionId) {
          console.log(`🔍 Vérification de la connexion ${connection.institutionName}...`);
          await this.syncConnection(connection.id);
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification de ${connection.institutionName}:`, error);
      }
    }
  }

  private autoSyncInterval: NodeJS.Timeout | null = null;

  // Additional convenience methods
  getConfiguration() {
    return localBankingStorage.getConfig();
  }

  isConfigured(): boolean {
    // Vérifier si on a un token en mémoire ou un token valide stocké
    if (this.accessToken) return true;
    
    const config = localBankingStorage.getConfig();
    return !!(config?.accessToken && config.tokenExpiry && Date.now() < config.tokenExpiry);
  }

  async initialize(): Promise<void> {
    await this.initializeToken();
  }

  async getBankConnections(userId: string = 'local-user'): Promise<BankConnection[]> {
    return this.getConnections(userId);
  }

  async createBankConnection(institutionId: string): Promise<{ link: string; requisitionId: string }> {
    return this.createConnection(institutionId, 'local-user');
  }

  async completeBankConnection(requisitionId: string): Promise<void> {
    // Get the connection by requisition ID and sync it
    const connections = localBankingStorage.getConnections();
    const connection = connections.find(c => c.requisitionId === requisitionId);

    if (!connection) throw new Error('Connection not found');

    await this.syncConnection(connection.id);
  }

  async disconnectBank(connectionId: string): Promise<void> {
    return this.deleteConnection(connectionId);
  }

  async syncTransactions(connectionId: string): Promise<SyncResult> {
    return this.syncConnection(connectionId);
  }

  // Nouvelles méthodes pour le stockage local
  getBankAccounts(): BankAccount[] {
    return localBankingStorage.getAccounts();
  }

  getBankTransactions(): BankTransaction[] {
    return localBankingStorage.getTransactions();
  }

  deleteBankTransaction(transactionId: string): void {
    localBankingStorage.deleteTransaction(transactionId);
  }

  // Récupère les paiements GoCardless (sandbox)
  async fetchGoCardlessPayments(): Promise<BankTransaction[]> {
    const token = await this.getValidToken();
    const response = await fetch('https://api-sandbox.gocardless.com/payments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'GoCardless-Version': '2015-07-06',
        'Accept': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Erreur récupération paiements GoCardless');
    const data = await response.json();
    return (data.payments || []).map((p: any) => ({
      id: p.id,
      accountId: p.links?.mandate || '',
      amount: parseFloat(p.amount) / 100,
      currency: p.currency,
      date: new Date(p.created_at),
      description: p.description || '',
      type: p.amount > 0 ? 'credit' : 'debit',
      status: p.status === 'confirmed' ? 'completed' : 'pending',
      metadata: p
    }));
  }
}

export const bankingService = new BankingService();
