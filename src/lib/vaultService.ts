import { supabase } from './supabase';

export interface VaultEntry {
  id?: string;
  key: string;
  value: string;
  encrypted: boolean;
  description?: string;
  category: 'mail' | 'database' | 'api' | 'system' | 'security';
  created_at?: string;
  updated_at?: string;
}

export interface MailServerConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string; // Sera chiffré dans le vault
  from: string;
  replyTo?: string;
  enabled: boolean;
  provider: 'ovh' | 'gmail' | 'outlook' | 'sendgrid' | 'mailgun' | 'other';
}

class VaultService {
  // Simple encryption/decryption using base64 + rot13 (pour la démonstration)
  // En production, utilisez crypto.subtle ou une bibliothèque de chiffrement robuste
  private encrypt(text: string): string {
    try {
      // Convertir en base64 puis appliquer rot13
      const base64 = btoa(unescape(encodeURIComponent(text)));
      return base64.replace(/[a-zA-Z]/g, (c) => {
        const charCode = c.charCodeAt(0);
        const offset = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((charCode - offset + 13) % 26) + offset);
      });
    } catch (error) {
      console.error('Erreur de chiffrement:', error);
      return text;
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      // Inverser rot13 puis décoder base64
      const unrot = encryptedText.replace(/[a-zA-Z]/g, (c) => {
        const charCode = c.charCodeAt(0);
        const offset = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((charCode - offset + 13) % 26) + offset);
      });
      return decodeURIComponent(escape(atob(unrot)));
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      return encryptedText;
    }
  }

  /**
   * Stocke une entrée dans le vault
   */
  async storeEntry(entry: Omit<VaultEntry, 'id' | 'created_at' | 'updated_at'>): Promise<VaultEntry> {
    try {
      const entryToStore: VaultEntry = {
        ...entry,
        value: entry.encrypted ? this.encrypt(entry.value) : entry.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('vault')
        .insert(entryToStore)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        value: entry.encrypted ? this.decrypt(data.value) : data.value
      };
    } catch (error) {
      console.error('Erreur lors du stockage dans le vault:', error);
      throw error;
    }
  }

  /**
   * Récupère une entrée du vault par clé
   */
  async getEntry(key: string): Promise<VaultEntry | null> {
    try {
      const { data, error } = await supabase
        .from('vault')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Pas trouvé
        }
        throw error;
      }

      return {
        ...data,
        value: data.encrypted ? this.decrypt(data.value) : data.value
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du vault:', error);
      throw error;
    }
  }

  /**
   * Met à jour une entrée du vault
   */
  async updateEntry(key: string, updates: Partial<VaultEntry>): Promise<VaultEntry> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.value && updates.encrypted) {
        updateData.value = this.encrypt(updates.value);
      }

      const { data, error } = await supabase
        .from('vault')
        .update(updateData)
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        value: data.encrypted ? this.decrypt(data.value) : data.value
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du vault:', error);
      throw error;
    }
  }

  /**
   * Supprime une entrée du vault
   */
  async deleteEntry(key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vault')
        .delete()
        .eq('key', key);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression du vault:', error);
      throw error;
    }
  }

  /**
   * Liste toutes les entrées d'une catégorie
   */
  async listEntries(category?: string): Promise<VaultEntry[]> {
    try {
      let query = supabase.from('vault').select('*');
      
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(entry => ({
        ...entry,
        value: entry.encrypted ? '[CHIFFRÉ]' : entry.value // Ne pas déchiffrer pour la liste
      }));
    } catch (error) {
      console.error('Erreur lors de la liste du vault:', error);
      throw error;
    }
  }

  /**
   * Stocke la configuration du serveur mail dans le vault
   */
  async storeMailConfig(config: MailServerConfig): Promise<void> {
    try {
      // Stocker chaque propriété séparément
      const entries = [
        {
          key: 'mail_server_host',
          value: config.host,
          encrypted: false,
          description: 'Serveur SMTP hostname',
          category: 'mail' as const
        },
        {
          key: 'mail_server_port',
          value: config.port.toString(),
          encrypted: false,
          description: 'Port du serveur SMTP',
          category: 'mail' as const
        },
        {
          key: 'mail_server_secure',
          value: config.secure.toString(),
          encrypted: false,
          description: 'Utilisation SSL/TLS',
          category: 'mail' as const
        },
        {
          key: 'mail_server_username',
          value: config.username,
          encrypted: true,
          description: 'Nom d\'utilisateur SMTP',
          category: 'mail' as const
        },
        {
          key: 'mail_server_password',
          value: config.password,
          encrypted: true,
          description: 'Mot de passe SMTP',
          category: 'mail' as const
        },
        {
          key: 'mail_server_from',
          value: config.from,
          encrypted: false,
          description: 'Adresse email d\'expédition',
          category: 'mail' as const
        },
        {
          key: 'mail_server_reply_to',
          value: config.replyTo || '',
          encrypted: false,
          description: 'Adresse de réponse',
          category: 'mail' as const
        },
        {
          key: 'mail_server_enabled',
          value: config.enabled.toString(),
          encrypted: false,
          description: 'Service mail activé',
          category: 'mail' as const
        },
        {
          key: 'mail_server_provider',
          value: config.provider,
          encrypted: false,
          description: 'Fournisseur de service mail',
          category: 'mail' as const
        }
      ];

      // Supprimer les anciennes entrées mail
      await this.clearMailConfig();

      // Stocker toutes les nouvelles entrées
      for (const entry of entries) {
        await this.storeEntry(entry);
      }

      console.log('✅ Configuration mail sauvegardée dans le vault');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la configuration mail:', error);
      throw error;
    }
  }

  /**
   * Récupère la configuration du serveur mail depuis le vault
   */
  async getMailConfig(): Promise<MailServerConfig | null> {
    try {
      const [
        host,
        port,
        secure,
        username,
        password,
        from,
        replyTo,
        enabled,
        provider
      ] = await Promise.all([
        this.getEntry('mail_server_host'),
        this.getEntry('mail_server_port'),
        this.getEntry('mail_server_secure'),
        this.getEntry('mail_server_username'),
        this.getEntry('mail_server_password'),
        this.getEntry('mail_server_from'),
        this.getEntry('mail_server_reply_to'),
        this.getEntry('mail_server_enabled'),
        this.getEntry('mail_server_provider')
      ]);

      if (!host || !port || !username || !password || !from) {
        return null; // Configuration incomplète
      }

      return {
        host: host.value,
        port: parseInt(port.value),
        secure: secure?.value === 'true',
        username: username.value,
        password: password.value,
        from: from.value,
        replyTo: replyTo?.value || undefined,
        enabled: enabled?.value === 'true',
        provider: (provider?.value as MailServerConfig['provider']) || 'other'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration mail:', error);
      return null;
    }
  }

  /**
   * Supprime toute la configuration mail du vault
   */
  async clearMailConfig(): Promise<void> {
    try {
      const mailKeys = [
        'mail_server_host',
        'mail_server_port',
        'mail_server_secure',
        'mail_server_username',
        'mail_server_password',
        'mail_server_from',
        'mail_server_reply_to',
        'mail_server_enabled',
        'mail_server_provider'
      ];

      for (const key of mailKeys) {
        try {
          await this.deleteEntry(key);
        } catch (error) {
          // Ignorer si l'entrée n'existe pas
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la configuration mail:', error);
      throw error;
    }
  }

  /**
   * Teste si le vault est accessible
   */
  async testVaultConnection(): Promise<boolean> {
    try {
      // Tenter de lister les entrées pour vérifier la connectivité
      await this.listEntries();
      return true;
    } catch (error) {
      console.error('Vault inaccessible:', error);
      return false;
    }
  }
}

export const vaultService = new VaultService();
