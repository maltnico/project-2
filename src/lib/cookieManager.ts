/**
 * Gestionnaire de cookies et de persistance amélioré pour EasyBail
 * Gère les cookies, les sessions et la synchronisation des données
 */

interface CookieOptions {
  expires?: Date;
  maxAge?: number; // en secondes
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

interface SessionData {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  lastActivity: number;
  fingerprint: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

class CookieManager {
  private readonly SESSION_KEY = 'easybail_session';
  private readonly CACHE_PREFIX = 'easybail_cache_';
  private readonly FINGERPRINT_KEY = 'easybail_fingerprint';
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 heures
  private readonly CACHE_VERSION = '1.0.0';

  /**
   * Générer une empreinte unique pour le navigateur
   */
  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('EasyBail fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).slice(0, 32);
  }

  /**
   * Obtenir l'empreinte du navigateur stockée ou en créer une nouvelle
   */
  private getBrowserFingerprint(): string {
    let fingerprint = localStorage.getItem(this.FINGERPRINT_KEY);
    
    if (!fingerprint) {
      fingerprint = this.generateFingerprint();
      localStorage.setItem(this.FINGERPRINT_KEY, fingerprint);
    }
    
    return fingerprint;
  }

  /**
   * Définir un cookie avec options avancées
   */
  setCookie(name: string, value: string, options: CookieOptions = {}): void {
    try {
      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
      
      if (options.expires) {
        cookieString += `; expires=${options.expires.toUTCString()}`;
      }
      
      if (options.maxAge) {
        cookieString += `; max-age=${options.maxAge}`;
      }
      
      if (options.domain) {
        cookieString += `; domain=${options.domain}`;
      }
      
      if (options.path) {
        cookieString += `; path=${options.path}`;
      } else {
        cookieString += `; path=/`;
      }
      
      if (options.secure) {
        cookieString += `; secure`;
      }
      
      if (options.sameSite) {
        cookieString += `; samesite=${options.sameSite}`;
      }
      
      document.cookie = cookieString;
        } catch {
      console.warn('Error syncing cookie preferences');
    }
  }

  /**
   * Obtenir la valeur d'un cookie
   */
  getCookie(name: string): string | null {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${encodeURIComponent(name)}=`);
      
      if (parts.length === 2) {
        return decodeURIComponent(parts.pop()!.split(';').shift()!);
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la lecture du cookie:', error);
      return null;
    }
  }

  /**
   * Supprimer un cookie
   */
  deleteCookie(name: string, path: string = '/', domain?: string): void {
    try {
      this.setCookie(name, '', {
        expires: new Date(0),
        path,
        domain
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du cookie:', error);
    }
  }

  /**
   * Sauvegarder les données de session avec sécurité renforcée
   */
  saveSession(sessionData: Omit<SessionData, 'fingerprint' | 'lastActivity'>): void {
    try {
      const fullSessionData: SessionData = {
        ...sessionData,
        fingerprint: this.getBrowserFingerprint(),
        lastActivity: Date.now()
      };

      // Chiffrer les données sensibles
      const encryptedData = this.encryptData(JSON.stringify(fullSessionData));
      
      // Sauvegarder dans localStorage et cookie
      localStorage.setItem(this.SESSION_KEY, encryptedData);
      
      // Cookie sécurisé avec expiration
      this.setCookie(this.SESSION_KEY, encryptedData, {
        maxAge: this.SESSION_TIMEOUT / 1000,
        secure: window.location.protocol === 'https:',
        sameSite: 'lax',
        path: '/'
      });

      console.log('Session sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session:', error);
    }
  }

  /**
   * Récupérer les données de session
   */
  getSession(): SessionData | null {
    try {
      // Essayer d'abord localStorage, puis cookie
      const encryptedData = localStorage.getItem(this.SESSION_KEY) || this.getCookie(this.SESSION_KEY);
      
      if (!encryptedData) {
        return null;
      }

      const decryptedData = this.decryptData(encryptedData);
      const sessionData: SessionData = JSON.parse(decryptedData);
      
      // Vérifier l'expiration
      if (sessionData.expiresAt < Date.now()) {
        this.clearSession();
        return null;
      }

      // Vérifier l'empreinte du navigateur
      const currentFingerprint = this.getBrowserFingerprint();
      if (sessionData.fingerprint !== currentFingerprint) {
        console.warn('Empreinte du navigateur modifiée, session invalidée');
        this.clearSession();
        return null;
      }

      // Vérifier l'activité récente (timeout d'inactivité)
      const inactivityTimeout = 2 * 60 * 60 * 1000; // 2 heures
      if (Date.now() - sessionData.lastActivity > inactivityTimeout) {
        console.warn('Session expirée par inactivité');
        this.clearSession();
        return null;
      }

      // Mettre à jour l'activité
      sessionData.lastActivity = Date.now();
      this.saveSession(sessionData);

      return sessionData;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Nettoyer toutes les données de session
   */
  clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      this.deleteCookie(this.SESSION_KEY);
      console.log('Session nettoyée');
    } catch (error) {
      console.error('Erreur lors du nettoyage de la session:', error);
    }
  }

  /**
   * Vérifier si une session est valide
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  /**
   * Chiffrement simple des données (pour la démo)
   */
  private encryptData(data: string): string {
    try {
      return btoa(encodeURIComponent(data));
    } catch (error) {
      console.error('Erreur de chiffrement:', error);
      return data;
    }
  }

  /**
   * Déchiffrement simple des données
   */
  private decryptData(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      return encryptedData;
    }
  }

  /**
   * Mettre en cache des données avec expiration
   */
  setCacheData<T>(key: string, data: T, expirationMinutes: number = 60): void {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (expirationMinutes * 60 * 1000),
        version: this.CACHE_VERSION
      };

      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error(`Erreur lors de la mise en cache de ${key}:`, error);
    }
  }

  /**
   * Récupérer des données du cache
   */
  getCacheData<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      
      if (!cached) {
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(cached);
      
      // Vérifier l'expiration
      if (Date.now() > cacheEntry.expiresAt) {
        this.deleteCacheData(key);
        return null;
      }

      // Vérifier la version
      if (cacheEntry.version !== this.CACHE_VERSION) {
        this.deleteCacheData(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du cache ${key}:`, error);
      this.deleteCacheData(key);
      return null;
    }
  }

  /**
   * Supprimer des données du cache
   */
  deleteCacheData(key: string): void {
    try {
      localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du cache ${key}:`, error);
    }
  }

  /**
   * Nettoyer tout le cache
   */
  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cache nettoyé');
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache:', error);
    }
  }

  /**
   * Forcer le rechargement des données à la prochaine connexion
   */
  markDataForRefresh(): void {
    try {
      localStorage.setItem('easybail_force_refresh', Date.now().toString());
      this.clearAllCache();
      console.log('Données marquées pour rechargement');
    } catch (error) {
      console.error('Erreur lors du marquage pour rechargement:', error);
    }
  }

  /**
   * Vérifier si les données doivent être rechargées
   */
  shouldRefreshData(): boolean {
    try {
      const forceRefresh = localStorage.getItem('easybail_force_refresh');
      if (forceRefresh) {
        localStorage.removeItem('easybail_force_refresh');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification du rechargement:', error);
      return false;
    }
  }

  /**
   * Nettoyer les données expirées
   */
  cleanupExpiredData(): void {
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheEntry: CacheEntry<any> = JSON.parse(cached);
              if (Date.now() > cacheEntry.expiresAt) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Supprimer les entrées corrompues
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage des données expirées:', error);
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats(): { totalEntries: number; totalSize: number; expiredEntries: number } {
    let totalEntries = 0;
    let totalSize = 0;
    let expiredEntries = 0;

    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          totalEntries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
            try {
              const cacheEntry: CacheEntry<unknown> = JSON.parse(value);
              if (Date.now() > cacheEntry.expiresAt) {
                expiredEntries++;
              }
            } catch {
              expiredEntries++;
            }
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques du cache:', error);
    }

    return { totalEntries, totalSize, expiredEntries };
  }
}

// Instance singleton
export const cookieManager = new CookieManager();

// Auto-nettoyage périodique des données expirées
setInterval(() => {
  cookieManager.cleanupExpiredData();
}, 30 * 60 * 1000); // Toutes les 30 minutes
