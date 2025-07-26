import { supabase } from './supabase';
import { localEmailService } from './localEmailService';
import { emailConfigurationService, EmailConfiguration } from './emailConfigurationService';

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
  replyTo?: string;
  enabled: boolean;
  provider: 'ovh' | 'gmail' | 'outlook' | 'sendgrid' | 'mailgun' | 'other';
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
    encoding: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VerifyResult {
  success: boolean;
  error?: string;
}

class MailService {
  async isConfigured(): Promise<boolean> {
    return await emailConfigurationService.isConfigured();
  }

  async getConfig(): Promise<MailConfig | null> {
    try {
      const config = await emailConfigurationService.getConfiguration();
      if (!config) return null;

      return {
        host: config.host,
        port: config.port,
        secure: config.secure,
        username: config.username,
        password: config.password,
        from: config.from_email,
        replyTo: config.reply_to,
        enabled: config.enabled,
        provider: config.provider
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration mail:', error);
      return null;
    }
  }

  async saveConfig(config: MailConfig): Promise<void> {
    try {
      // Valider la configuration avant de la sauvegarder
      const errors: string[] = [];
      
      if (!config.host || config.host.trim() === '') {
        errors.push('Host du serveur SMTP est requis');
      }
      
      if (!config.username || config.username.trim() === '') {
        errors.push('Nom d\'utilisateur est requis');
      }
      
      if (!config.from || config.from.trim() === '') {
        errors.push('Adresse email d\'expéditeur est requise');
      }
      
      if (errors.length > 0) {
        throw new Error(`Configuration incomplète: ${errors.join(', ')}`);
      }
      
      // Convertir au format EmailConfiguration
      const emailConfig: Omit<EmailConfiguration, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        host: config.host.trim(),
        port: config.port,
        secure: config.secure,
        username: config.username.trim(),
        password: config.password,
        from_email: config.from.trim(),
        reply_to: config.replyTo?.trim(),
        enabled: config.enabled,
        provider: config.provider
      };

      await emailConfigurationService.saveConfiguration(emailConfig);
      console.log('✅ Configuration mail sauvegardée avec succès');
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Erreur lors de la sauvegarde de la configuration mail:', error.message);
        throw new Error(`Échec de la sauvegarde: ${error.message}`);
      } else {
        console.error('❌ Erreur inconnue lors de la sauvegarde de la configuration mail:', error);
        throw new Error('Erreur inconnue lors de la sauvegarde');
      }
    }
  }

  async verifyConnection(): Promise<VerifyResult> {
    const config = await this.getConfig();
    if (!config) {
      return {
        success: false,
        error: 'Configuration mail non trouvée'
      };
    }

    try {
      // Check if Supabase is properly configured
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY; 
      const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id') && !supabaseAnonKey.includes('your-anon-key');
      
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured. Using local email service.');
        // Utiliser le service local
        return await localEmailService.verifyConnection();
      }
      
      console.log('Test de connexion SMTP...');
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          config,
          action: 'verify'
        }
      });

      if (error) {
        console.error('Erreur lors du test de connexion:', error);
        return {
          success: false,
          error: error.message || 'Erreur lors du test de connexion'
        };
      }

      if (data && data.success) {
        console.log('Test de connexion réussi');
        return { success: true };
      } else {
        return {
          success: false,
          error: data?.error || 'Échec de la vérification de connexion'
        };
      }
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const config = await this.getConfig();
      if (!config) {
        return {
          success: false,
          error: 'Configuration mail non trouvée'
        };
      }

      // Check if Supabase is properly configured
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY; 
      const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id') && !supabaseAnonKey.includes('your-anon-key');
      
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured. Using local email service.');
        // Utiliser le service local
        return await localEmailService.sendEmail(options);
      }

      console.log('Envoi d\'email...', {
        to: options.to,
        subject: options.subject,
        hasAttachments: options.attachments && options.attachments.length > 0
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          config,
          emailOptions: options
        }
      });

      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        return {
          success: false,
          error: error.message || 'Erreur lors de l\'envoi de l\'email'
        };
      }

      if (data && data.success) {
        console.log('Email envoyé avec succès', data);
        return {
          success: true,
          messageId: data.messageId
        };
      } else {
        return {
          success: false,
          error: data?.error || 'Échec de l\'envoi de l\'email'
        };
      }
    } catch (error) {
      console.warn('Erreur lors de l\'envoi de l\'email via Supabase, utilisation du service local:', error);
      
      // En cas d'erreur, utiliser le service local comme fallback
      try {
        return await localEmailService.sendEmail(options);
      } catch (localError) {
        console.error('Erreur lors de l\'envoi de l\'email via le service local:', localError);
        return {
          success: false,
          error: localError instanceof Error ? localError.message : 'Erreur inconnue'
        };
      }
    }
  }

  async sendTestEmail(to: string): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject: 'Email de test',
      text: 'Ceci est un email de test envoyé depuis votre application de gestion locative.',
      html: '<p>Ceci est un email de test envoyé depuis votre application de gestion locative.</p>'
    });
  }
}

export const mailService = new MailService();
