import { vaultService } from './vaultService';

interface ContactEmailData {
  to: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  userInfo?: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    companyName?: string;
    userId?: string;
  };
}

// Fonction pour récupérer la configuration mail OVH depuis l'admin
const getMailConfig = async () => {
  try {
    // Essayer de récupérer depuis le vault sécurisé d'abord
    const vaultConfig = await vaultService.getMailConfig();
    if (vaultConfig && vaultConfig.enabled) {
      return vaultConfig;
    }

    // Fallback vers localStorage si le vault n'est pas disponible
    const stored = localStorage.getItem('mail_config');
    if (stored) {
      const config = JSON.parse(stored);
      if (config && config.enabled) {
        return config;
      }
    }

    // Si aucune configuration n'est trouvée, retourner null
    console.warn('Aucune configuration mail trouvée dans l\'admin');
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration mail:', error);
    return null;
  }
};

// Alternative implementation using direct OVH SMTP configuration from admin
export const sendContactEmailDirect = async (data: ContactEmailData): Promise<void> => {
  try {
    // Récupérer la configuration mail depuis l'admin
    const mailConfig = await getMailConfig();
    
    if (!mailConfig) {
      throw new Error('Configuration mail non trouvée. Veuillez configurer les paramètres SMTP dans l\'administration.');
    }

    if (!mailConfig.enabled) {
      throw new Error('Le service d\'envoi d\'email est désactivé. Veuillez l\'activer dans l\'administration.');
    }

    // Préparer les données pour l'envoi avec la config OVH de l'admin
    const emailPayload = {
      config: {
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        username: mailConfig.username,
        password: mailConfig.password
      },
      emailOptions: {
        from: mailConfig.from,
        to: data.to,
        subject: data.subject,
        html: data.message.replace(/\n/g, '<br>'),
        text: data.message,
        replyTo: mailConfig.replyTo || mailConfig.from
      }
    };

    console.log(`Envoi d'email via ${mailConfig.provider.toUpperCase()} - ${mailConfig.host}:${mailConfig.port}`);

    // Envoyer via Supabase Edge Function ou serveur local selon la configuration
    let response;
    
    if (import.meta.env.VITE_SUPABASE_URL) {
      // Utiliser Supabase Edge Function
      response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(emailPayload),
      });
    } else {
      // Fallback vers serveur local
      response = await fetch('http://localhost:3001/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de l\'envoi de l\'email');
    }

    console.log('Email envoyé avec succès via configuration admin:', result);
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    
    // Fallback: log les données pour traitement manuel
    console.log('Données email pour traitement manuel:', {
      timestamp: new Date().toISOString(),
      ...data
    });
    
    throw new Error(error instanceof Error ? error.message : 'Échec de l\'envoi de l\'email');
  }
};