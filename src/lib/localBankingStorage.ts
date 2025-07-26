import { BankConnection, BankAccount, BankTransaction } from '../types/banking';

// Keys pour le localStorage
const STORAGE_KEYS = {
  CONNECTIONS: 'banking_connections',
  ACCOUNTS: 'banking_accounts',
  TRANSACTIONS: 'banking_transactions',
  CONFIG: 'banking_config'
};

export interface LocalBankingConfig {
  accessToken?: string;
  environment: 'sandbox' | 'live';
  userId?: string;
  tokenExpiry?: number;
}

class LocalBankingStorage {
  // Configuration
  saveConfig(config: LocalBankingConfig): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  getConfig(): LocalBankingConfig | null {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? JSON.parse(data) : null;
  }

  // Connexions bancaires
  saveConnection(connection: BankConnection): void {
    const connections = this.getConnections();
    const existingIndex = connections.findIndex(c => c.id === connection.id);
    
    if (existingIndex >= 0) {
      connections[existingIndex] = connection;
    } else {
      connections.push(connection);
    }
    
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
  }

  getConnections(): BankConnection[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    return data ? JSON.parse(data) : [];
  }

  deleteConnection(connectionId: string): void {
    const connections = this.getConnections().filter(c => c.id !== connectionId);
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
    
    // Supprimer aussi les comptes et transactions associés
    this.deleteAccountsByConnectionId(connectionId);
  }

  // Comptes bancaires
  saveAccount(account: BankAccount): void {
    const accounts = this.getAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  getAccounts(): BankAccount[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!data) return [];
    
    const accounts = JSON.parse(data);
    // Convertir les dates string en objets Date
    return accounts.map((account: any) => ({
      ...account,
      lastSync: new Date(account.lastSync)
    }));
  }

  getAccountsByConnectionId(connectionId: string): BankAccount[] {
    return this.getAccounts().filter(account => 
      account.metadata?.connectionId === connectionId
    );
  }

  deleteAccountsByConnectionId(connectionId: string): void {
    const accounts = this.getAccounts().filter(account => 
      account.metadata?.connectionId !== connectionId
    );
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    
    // Supprimer aussi les transactions associées
    this.deleteTransactionsByConnectionId(connectionId);
  }

  // Transactions bancaires
  saveTransaction(transaction: BankTransaction): void {
    const transactions = this.getTransactions();
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  saveTransactions(newTransactions: BankTransaction[]): void {
    const existingTransactions = this.getTransactions();
    
    newTransactions.forEach(newTx => {
      const existingIndex = existingTransactions.findIndex(t => t.id === newTx.id);
      if (existingIndex >= 0) {
        existingTransactions[existingIndex] = newTx;
      } else {
        existingTransactions.push(newTx);
      }
    });
    
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(existingTransactions));
  }

  getTransactions(): BankTransaction[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    
    const transactions = JSON.parse(data);
    // Convertir les dates string en objets Date
    return transactions.map((tx: any) => ({
      ...tx,
      date: new Date(tx.date),
      valueDate: tx.valueDate ? new Date(tx.valueDate) : undefined
    }));
  }

  getTransactionsByAccountId(accountId: string): BankTransaction[] {
    return this.getTransactions().filter(tx => tx.accountId === accountId);
  }

  deleteTransaction(transactionId: string): void {
    const transactions = this.getTransactions().filter(t => t.id !== transactionId);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  deleteTransactionsByConnectionId(connectionId: string): void {
    const accounts = this.getAccountsByConnectionId(connectionId);
    const accountIds = accounts.map(a => a.id);
    
    const transactions = this.getTransactions().filter(tx => 
      !accountIds.includes(tx.accountId)
    );
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  // Méthodes utilitaires
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  exportData(): string {
    const data = {
      config: this.getConfig(),
      connections: this.getConnections(),
      accounts: this.getAccounts(),
      transactions: this.getTransactions()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.config) this.saveConfig(data.config);
      if (data.connections) {
        localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(data.connections));
      }
      if (data.accounts) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data.accounts));
      }
      if (data.transactions) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      }
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error);
      throw new Error('Format de données invalide');
    }
  }
}

export const localBankingStorage = new LocalBankingStorage();
