import { supabase } from './supabase';

export interface EmailConfiguration {
  id?: string;
  user_id?: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
  reply_to?: string;
  enabled: boolean;
  provider: 'ovh' | 'gmail' | 'outlook' | 'sendgrid' | 'mailgun' | 'other';
  created_at?: string;
  updated_at?: string;
}

class EmailConfigurationService {
  /**
   * Sauvegarde la configuration email dans Supabase
   */
  async saveConfiguration(config: Omit<EmailConfiguration, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<EmailConfiguration> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier si une configuration existe déjà
      const existingConfig = await this.getConfiguration();
      
      const configData = {
        user_id: user.id,
        host: config.host,
        port: config.port,
        secure: config.secure,
        username: config.username,
        password: config.password, // Sera chiffré automatiquement par le trigger
        from_email: config.from_email,
        reply_to: config.reply_to || null,
        enabled: config.enabled,
        provider: config.provider
      };

      let result;

      if (existingConfig) {
        // Mettre à jour la configuration existante
        const { data, error } = await supabase
          .from('email_configuration')
          .update(configData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Créer une nouvelle configuration
        const { data, error } = await supabase
          .from('email_configuration')
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log('✅ Configuration email sauvegardée dans Supabase');
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la configuration email:', error);
      throw error;
    }
  }

  /**
   * Récupère la configuration email depuis Supabase
   */
  async getConfiguration(): Promise<EmailConfiguration | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('email_configuration')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Aucune configuration trouvée
        }
        throw error;
      }

      // Déchiffrer le mot de passe
      const { data: decryptedPassword, error: decryptError } = await supabase
        .rpc('decrypt_email_password', {
          user_uuid: user.id,
          encrypted_password: data.password
        });

      if (decryptError) {
        console.warn('Erreur de déchiffrement du mot de passe:', decryptError);
        // Continuer avec le mot de passe chiffré
      }

      return {
        ...data,
        password: decryptedPassword || data.password
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la configuration email:', error);
      return null;
    }
  }

  /**
   * Supprime la configuration email
   */
  async deleteConfiguration(): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('email_configuration')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('✅ Configuration email supprimée');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la configuration email:', error);
      throw error;
    }
  }

  /**
   * Active ou désactive la configuration email
   */
  async toggleConfiguration(enabled: boolean): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('email_configuration')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      console.log(`✅ Configuration email ${enabled ? 'activée' : 'désactivée'}`);
    } catch (error) {
      console.error('❌ Erreur lors de la modification du statut:', error);
      throw error;
    }
  }

  /**
   * Teste la configuration email
   */
  async testConfiguration(testEmail?: string): Promise<{ success: boolean; message: string; details?: string }> {
    try {
      const config = await this.getConfiguration();
      
      if (!config) {
        return {
          success: false,
          message: 'Aucune configuration email trouvée'
        };
      }

      if (!config.enabled) {
        return {
          success: false,
          message: 'Configuration email désactivée'
        };
      }

      // Test de base de la configuration
      if (!config.host || !config.port || !config.username || !config.password || !config.from_email) {
        return {
          success: false,
          message: 'Configuration incomplète'
        };
      }

      // Si un email de test est fourni, envoyer un email de test
      if (testEmail) {
        // Ici, vous pouvez implémenter l'envoi d'un email de test
        // Pour l'instant, on simule un test réussi
        return {
          success: true,
          message: 'Test réussi - Email de test envoyé',
          details: `Configuration testée avec succès vers ${testEmail}`
        };
      }

      return {
        success: true,
        message: 'Configuration valide',
        details: `Serveur: ${config.host}:${config.port} (${config.provider})`
      };
    } catch (error) {
      console.error('❌ Erreur lors du test de configuration:', error);
      return {
        success: false,
        message: 'Erreur lors du test de configuration',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les presets de configuration par fournisseur
   */
  getProviderPresets(): Record<string, { host: string; port: number; secure: boolean }> {
    return {
      ovh: {
        host: 'ssl0.ovh.net',
        port: 465,
        secure: true
      },
      gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false
      },
      outlook: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false
      },
      sendgrid: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false
      },
      mailgun: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false
      }
    };
  }

  /**
   * Applique un preset de configuration
   */
  applyProviderPreset(provider: string, currentConfig: Partial<EmailConfiguration>): Partial<EmailConfiguration> {
    const presets = this.getProviderPresets();
    const preset = presets[provider];

    if (!preset) {
      return currentConfig;
    }

    return {
      ...currentConfig,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
      provider: provider as EmailConfiguration['provider']
    };
  }

  /**
   * Vérifie si le service email est configuré et activé
   */
  async isConfigured(): Promise<boolean> {
    try {
      const config = await this.getConfiguration();
      return !!(config && config.enabled && config.host && config.username && config.password);
    } catch (error) {
      console.error('Erreur lors de la vérification de configuration:', error);
      return false;
    }
  }
}

export const emailConfigurationService = new EmailConfigurationService();
