import { automationService } from './automationService';

/**
 * Service pour gérer les exécutions programmées des automatisations
 */
class AutomationScheduler {
  private timerId: number | null = null;
  private checkInterval = 600000; // Vérifier toutes les 10 minutes pour permettre l'exécution le jour même
  private isRunning = false;

  /**
   * Démarre le planificateur d'automatisations
   */
  start(): void {
    if (this.isRunning) return;
    
    console.log('Démarrage du planificateur d\'automatisations');
    this.isRunning = true;
    
    // Vérifier si nous devons exécuter les automatisations maintenant
    this.checkDailySchedule();
    
    // Puis configurer l'intervalle
    this.timerId = window.setInterval(() => {
      this.checkDailySchedule();
    }, this.checkInterval);
  }

  /**
   * Arrête le planificateur d'automatisations
   */
  stop(): void {
    if (!this.isRunning || this.timerId === null) return;
    
    console.log('Arrêt du planificateur d\'automatisations');
    window.clearInterval(this.timerId);
    this.timerId = null;
    this.isRunning = false;
  }

  /**
   * Vérifie et exécute les automatisations dues à tout moment de la journée
   */
  private checkDailySchedule(): void {
    const now = new Date();
    console.log(`Vérification des automatisations à ${now.toLocaleTimeString('fr-FR')}`);
    
    // Exécuter les automatisations dues immédiatement
    this.checkAndExecuteAutomations();
    
    // Traiter la file d'attente des emails
    this.processEmailQueue();
  }

  /**
   * Vérifie et exécute les automatisations dues à l'heure programmée
   */
  private async checkAndExecuteAutomations(): Promise<void> {
    try {
      console.log(`Vérification des automatisations dues à ${new Date().toLocaleTimeString('fr-FR')}...`);
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Récupérer les automatisations actives
      const automations = automationService.getActiveAutomations();
      
      if (automations.length === 0) {
        console.log('Aucune automatisation active');
        return;
      }
      
      console.log(`${automations.length} automatisation(s) active(s) trouvée(s)`);
      
      // Exécuter chaque automatisation due à cette heure
      for (const automation of automations) {
        try {
          // Vérifier si l'automatisation est due (date passée ou aujourd'hui)
          const isDue = automation.nextExecution <= now;
          
          // Vérifier si l'heure correspond (avec une tolérance de +/- 10 minutes)
          const automationTime = automation.executionTime || '09:00';
          const [automationHour, automationMinute] = automationTime.split(':').map(Number);
          const automationMinutes = automationHour * 60 + automationMinute;
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const timeDiff = Math.abs(currentMinutes - automationMinutes);
          const isTimeMatched = timeDiff <= 10; // Tolérance de 10 minutes
          
          if (isDue && isTimeMatched) {
            console.log(`Exécution de l'automatisation: ${automation.name} (programmée à ${automationTime})`);
            await automationService.executeAutomation(automation.id);
          } else if (isDue && !isTimeMatched) {
            console.log(`Automatisation ${automation.name} due mais pas à la bonne heure (${automationTime} vs ${currentTime})`);
          }
        } catch (error) {
          console.error(`Erreur lors de l'exécution de l'automatisation ${automation.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des automatisations:', error);
    }
  }

  /**
   * Traite la file d'attente des emails
   */
  private async processEmailQueue(): Promise<void> {
    try {
      console.log('Traitement de la file d\'attente des emails...');
      const processedCount = await automationService.processEmailQueue();
      console.log(`${processedCount} email(s) traité(s) avec succès`);
    } catch (error) {
      console.error('Erreur lors du traitement de la file d\'attente des emails:', error);
    }
  }

  /**
   * Vérifie si le planificateur est en cours d'exécution
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Définit l'intervalle de vérification (en millisecondes)
   */
  setCheckInterval(interval: number): void {
    if (interval < 10000) {
      console.warn('L\'intervalle minimum est de 10 secondes');
      interval = 10000;
    }
    
    this.checkInterval = interval;
    
    // Redémarrer le planificateur si nécessaire
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Force l'exécution immédiate de toutes les automatisations dues
   */
  async forceCheck(): Promise<number> {
    try {
      // Récupérer les automatisations dues
      const now = new Date();
      console.log('Exécution forcée des automatisations dues...');
      const dueAutomations = automationService.getActiveAutomations();
      const dueAutomationsList = dueAutomations
        .filter(automation => automation.nextExecution <= now);
      
      let successCount = 0;
      
      for (const automation of dueAutomationsList) {
        try {
          console.log(`Exécution forcée de l'automatisation: ${automation.name}`);
          const success = await automationService.executeAutomation(automation.id);
          if (success) successCount++;
        } catch (error) {
          console.error(`Erreur lors de l'exécution forcée de l'automatisation ${automation.id}:`, error);
        }
      }
      
      // Traiter la file d'attente des emails
      await this.processEmailQueue();
      
      return successCount;
    } catch (error) {
      console.error('Erreur lors de la vérification forcée des automatisations:', error);
      return 0;
    }
  }
}

// Créer une instance singleton
export const automationScheduler = new AutomationScheduler();
