/**
 * Service de synchronisation des données pour EasyBail
 * Gère le rechargement et la synchronisation des données à chaque connexion
 */

import { cookieManager } from './cookieManager';
import { activityService } from './activityService';
import { emailTemplateService } from './emailTemplateService';
import { documentStorage } from './documentStorage';
import { notificationService } from './notificationService';

interface SyncStatus {
  isLoading: boolean;
  lastSync: number | null;
  error: string | null;
  progress: number;
  currentStep: string;
}

interface DataSource {
  name: string;
  key: string;
  syncFunction: () => Promise<any>;
  priority: number; // 1 = haute priorité, 3 = basse priorité
  cacheMinutes: number;
}

class DataSyncService {
  private syncStatus: SyncStatus = {
    isLoading: false,
    lastSync: null,
    error: null,
    progress: 0,
    currentStep: ''
  };

  private listeners: ((status: SyncStatus) => void)[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Écouter les changements de connectivité
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange();
    });
  }

  /**
   * Sources de données à synchroniser
   */
  private getDataSources(): DataSource[] {
    return [
      {
        name: 'Profil utilisateur',
        key: 'user_profile',
        syncFunction: () => this.syncUserProfile(),
        priority: 1,
        cacheMinutes: 30
      },
      {
        name: 'Propriétés',
        key: 'properties',
        syncFunction: () => this.syncProperties(),
        priority: 1,
        cacheMinutes: 15
      },
      {
        name: 'Locataires',
        key: 'tenants',
        syncFunction: () => this.syncTenants(),
        priority: 1,
        cacheMinutes: 15
      },
      {
        name: 'Activités',
        key: 'activities',
        syncFunction: () => this.syncActivities(),
        priority: 2,
        cacheMinutes: 5
      },
      {
        name: 'Documents',
        key: 'documents',
        syncFunction: () => this.syncDocuments(),
        priority: 2,
        cacheMinutes: 30
      },
      {
        name: 'Templates email',
        key: 'email_templates',
        syncFunction: () => this.syncEmailTemplates(),
        priority: 3,
        cacheMinutes: 60
      },
      {
        name: 'Notifications',
        key: 'notifications',
        syncFunction: () => this.syncNotifications(),
        priority: 2,
        cacheMinutes: 10
      },
      {
        name: 'Finances',
        key: 'finances',
        syncFunction: () => this.syncFinances(),
        priority: 2,
        cacheMinutes: 30
      },
      {
        name: 'Automatisations',
        key: 'automations',
        syncFunction: () => this.syncAutomations(),
        priority: 3,
        cacheMinutes: 60
      }
    ];
  }

  /**
   * Ajouter un listener pour les changements de statut
   */
  addListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifier les listeners des changements de statut
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.syncStatus });
      } catch (error) {
        console.error('Erreur dans le listener de sync:', error);
      }
    });
  }

  /**
   * Mettre à jour le statut de synchronisation
   */
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.notifyListeners();
  }

  /**
   * Gérer les changements de statut en ligne/hors ligne
   */
  private handleOnlineStatusChange(): void {
    if (this.isOnline) {
      console.log('Connexion rétablie, synchronisation automatique...');
      this.syncAllData(false);
    } else {
      console.log('Mode hors ligne activé');
      this.updateStatus({
        error: 'Mode hors ligne - utilisation des données locales'
      });
    }
  }

  /**
   * Vérifier si les données doivent être synchronisées
   */
  private shouldSync(dataSource: DataSource, forceRefresh: boolean): boolean {
    if (forceRefresh) return true;
    if (!this.isOnline) return false;

    const cachedData = cookieManager.getCacheData(dataSource.key);
    return cachedData === null;
  }

  /**
   * Synchroniser toutes les données
   */
  async syncAllData(forceRefresh: boolean = false): Promise<void> {
    if (this.syncStatus.isLoading) {
      console.log('Synchronisation déjà en cours...');
      return;
    }

    try {
      this.updateStatus({
        isLoading: true,
        error: null,
        progress: 0,
        currentStep: 'Initialisation...'
      });

      // Vérifier si un rechargement forcé est nécessaire
      const shouldForceRefresh = forceRefresh || cookieManager.shouldRefreshData();
      
      if (shouldForceRefresh) {
        console.log('Rechargement forcé des données détecté');
        cookieManager.clearAllCache();
      }

      const dataSources = this.getDataSources()
        .sort((a, b) => a.priority - b.priority); // Trier par priorité

      const totalSteps = dataSources.length;
      let completedSteps = 0;

      // Synchroniser chaque source de données
      for (const dataSource of dataSources) {
        if (!this.isOnline && dataSource.priority === 1) {
          // En mode hors ligne, essayer quand même les données critiques depuis le cache
          const cachedData = cookieManager.getCacheData(dataSource.key);
          if (cachedData) {
            console.log(`Utilisation des données en cache pour ${dataSource.name}`);
            completedSteps++;
            this.updateStatus({
              progress: (completedSteps / totalSteps) * 100,
              currentStep: `${dataSource.name} (cache)`
            });
            continue;
          }
        }

        if (this.shouldSync(dataSource, shouldForceRefresh)) {
          this.updateStatus({
            currentStep: `Synchronisation: ${dataSource.name}`
          });

          try {
            const data = await dataSource.syncFunction();
            
            // Mettre en cache les données récupérées
            if (data) {
              cookieManager.setCacheData(
                dataSource.key,
                data,
                dataSource.cacheMinutes
              );
            }

            console.log(`✅ ${dataSource.name} synchronisé`);
          } catch (error) {
            console.warn(`⚠️ Erreur lors de la synchronisation de ${dataSource.name}:`, error);
            
            // Essayer d'utiliser les données en cache
            const cachedData = cookieManager.getCacheData(dataSource.key);
            if (cachedData) {
              console.log(`Utilisation des données en cache pour ${dataSource.name}`);
            }
          }
        } else {
          console.log(`📋 ${dataSource.name} déjà à jour`);
        }

        completedSteps++;
        this.updateStatus({
          progress: (completedSteps / totalSteps) * 100
        });

        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.updateStatus({
        isLoading: false,
        lastSync: Date.now(),
        progress: 100,
        currentStep: 'Synchronisation terminée',
        error: null
      });

      console.log('🎉 Synchronisation complète terminée');

    } catch (error) {
      console.error('Erreur lors de la synchronisation globale:', error);
      this.updateStatus({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de synchronisation',
        currentStep: 'Erreur'
      });
    }
  }

  /**
   * Synchroniser le profil utilisateur
   */
  private async syncUserProfile(): Promise<any> {
    // Implémentation spécifique pour le profil utilisateur
    const session = cookieManager.getSession();
    if (!session) return null;

    // Simuler la récupération des données
    return { userId: session.userId, email: session.email };
  }

  /**
   * Synchroniser les propriétés
   */
  private async syncProperties(): Promise<any> {
    // Utiliser le service existant ou l'API
    try {
      // Pour l'instant, on simule la récupération
      return await new Promise(resolve => {
        setTimeout(() => resolve([]), 500);
      });
    } catch (error) {
      throw new Error('Impossible de synchroniser les propriétés');
    }
  }

  /**
   * Synchroniser les locataires
   */
  private async syncTenants(): Promise<any> {
    try {
      return await new Promise(resolve => {
        setTimeout(() => resolve([]), 500);
      });
    } catch (error) {
      throw new Error('Impossible de synchroniser les locataires');
    }
  }

  /**
   * Synchroniser les activités
   */
  private async syncActivities(): Promise<any> {
    try {
      // Forcer le rechargement des activités
      localStorage.removeItem('easybail_activities_loaded');
      return await activityService.getActivities();
    } catch (error) {
      throw new Error('Impossible de synchroniser les activités');
    }
  }

  /**
   * Synchroniser les documents
   */
  private async syncDocuments(): Promise<any> {
    try {
      // Utiliser la méthode existante pour récupérer les documents
      return await documentStorage.getDocumentsList();
    } catch (error) {
      throw new Error('Impossible de synchroniser les documents');
    }
  }

  /**
   * Synchroniser les templates email
   */
  private async syncEmailTemplates(): Promise<any> {
    try {
      return await emailTemplateService.getTemplates();
    } catch (error) {
      throw new Error('Impossible de synchroniser les templates email');
    }
  }

  /**
   * Synchroniser les notifications
   */
  private async syncNotifications(): Promise<any> {
    try {
      const result = await notificationService.getAllNotifications();
      return result.data || [];
    } catch (error) {
      throw new Error('Impossible de synchroniser les notifications');
    }
  }

  /**
   * Synchroniser les finances
   */
  private async syncFinances(): Promise<any> {
    try {
      return await new Promise(resolve => {
        setTimeout(() => resolve([]), 500);
      });
    } catch (error) {
      throw new Error('Impossible de synchroniser les finances');
    }
  }

  /**
   * Synchroniser les automatisations
   */
  private async syncAutomations(): Promise<any> {
    try {
      return await new Promise(resolve => {
        setTimeout(() => resolve([]), 500);
      });
    } catch (error) {
      throw new Error('Impossible de synchroniser les automatisations');
    }
  }

  /**
   * Synchroniser une source de données spécifique
   */
  async syncSpecificData(dataKey: string): Promise<void> {
    const dataSource = this.getDataSources().find(ds => ds.key === dataKey);
    
    if (!dataSource) {
      throw new Error(`Source de données inconnue: ${dataKey}`);
    }

    try {
      this.updateStatus({
        currentStep: `Synchronisation: ${dataSource.name}`
      });

      const data = await dataSource.syncFunction();
      
      if (data) {
        cookieManager.setCacheData(
          dataSource.key,
          data,
          dataSource.cacheMinutes
        );
      }

      console.log(`✅ ${dataSource.name} synchronisé`);
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${dataSource.name}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir le statut actuel de synchronisation
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Forcer un rechargement complet à la prochaine connexion
   */
  scheduleFullRefresh(): void {
    cookieManager.markDataForRefresh();
    console.log('Rechargement complet programmé pour la prochaine connexion');
  }

  /**
   * Nettoyer toutes les données et forcer un rechargement
   */
  clearAllDataAndRefresh(): void {
    cookieManager.clearAllCache();
    cookieManager.markDataForRefresh();
    console.log('Toutes les données nettoyées, rechargement forcé');
  }

  /**
   * Obtenir les statistiques de cache
   */
  getCacheStatistics(): { totalEntries: number; totalSize: number; expiredEntries: number } {
    return cookieManager.getCacheStats();
  }
}

// Instance singleton
export const dataSyncService = new DataSyncService();
