import { supabase } from './supabase';
import { mailService } from './mailService';
import { documentStorage } from './documentStorage';
import { localEmailService } from './localEmailService';
import { emailTemplateService } from './emailTemplateService';
import { activityService } from './activityService';
import { Automation } from '../types';

class AutomationService {
  // Récupérer toutes les automatisations de l'utilisateur connecté
  async getAll(): Promise<Automation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convertir les données de la base vers le format de l'application
      return (data || []).map((automation: any) => ({
        id: automation.id,
        name: automation.name,
        description: automation.description || '',
        type: automation.type || 'receipt',
        frequency: automation.frequency || 'monthly',
        nextExecution: automation.next_execution ? new Date(automation.next_execution) : new Date(),
        lastExecution: automation.last_execution ? new Date(automation.last_execution) : undefined,
        active: automation.active ?? true,
        propertyId: automation.property_id || undefined,
        emailTemplateId: automation.email_template_id || undefined,
        documentTemplateId: automation.document_template_id || undefined,
        executionTime: automation.execution_time || '09:00',
        createdAt: new Date(automation.created_at)
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des automatisations:', error);
      throw error;
    }
  }

  async getAutomations(): Promise<Automation[]> {
    return this.getAll();
  }

  async getActiveAutomations(): Promise<Automation[]> {
    const automations = await this.getAll();
    return automations.filter(automation => automation.active);
  }

  async getById(id: string): Promise<Automation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      // Convertir les données de la base vers le format de l'application
      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        type: data.type || 'receipt',
        frequency: data.frequency || 'monthly',
        nextExecution: data.next_execution ? new Date(data.next_execution) : new Date(),
        lastExecution: data.last_execution ? new Date(data.last_execution) : undefined,
        active: data.active ?? true,
        propertyId: data.property_id || undefined,
        emailTemplateId: data.email_template_id || undefined,
        documentTemplateId: data.document_template_id || undefined,
        executionTime: data.execution_time || '09:00',
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'automatisation:', error);
      throw error;
    }
  }

  async createAutomation(automation: Omit<Automation, 'id' | 'createdAt'>): Promise<Automation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Convertir les données de l'application vers le format de la base
      const automationData = {
        user_id: user.id,
        name: automation.name,
        description: automation.description || null,
        type: automation.type,
        frequency: automation.frequency,
        next_execution: automation.nextExecution?.toISOString(),
        last_execution: automation.lastExecution?.toISOString() || null,
        active: automation.active,
        property_id: automation.propertyId || null,
        email_template_id: automation.emailTemplateId || null,
        document_template_id: automation.documentTemplateId || null,
        execution_time: automation.executionTime || '09:00',
        // Colonnes pour la compatibilité avec l'ancien système
        trigger_type: 'scheduled',
        action_type: 'email',
        trigger_config: {},
        action_config: {}
      };

      const { data, error } = await supabase
        .from('automations')
        .insert(automationData)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de l\'automatisation:', error);
        throw error;
      }      // Enregistrer l'activité
      try {
        await activityService.addActivity({
          type: 'automation',
          action: 'created',
          title: 'Automatisation créée',
          description: `Automatisation "${data.name}" créée avec succès`,
          userId: user.id,
          priority: 'medium',
          category: 'success',
          entityId: data.id,
          entityType: 'automation',
          entityName: data.name,
          metadata: { automationId: data.id }
        });
      } catch (activityError) {
        console.warn('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      // Convertir vers le format de l'application
      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        type: data.type,
        frequency: data.frequency,
        nextExecution: new Date(data.next_execution),
        lastExecution: data.last_execution ? new Date(data.last_execution) : undefined,
        active: data.active,
        propertyId: data.property_id || undefined,
        emailTemplateId: data.email_template_id || undefined,
        documentTemplateId: data.document_template_id || undefined,
        executionTime: data.execution_time,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'automatisation:', error);
      throw error;
    }
  }

  async updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Convertir les mises à jour vers le format de la base
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
      if (updates.nextExecution !== undefined) updateData.next_execution = updates.nextExecution?.toISOString();
      if (updates.lastExecution !== undefined) updateData.last_execution = updates.lastExecution?.toISOString();
      if (updates.active !== undefined) updateData.active = updates.active;
      if (updates.propertyId !== undefined) updateData.property_id = updates.propertyId;
      if (updates.emailTemplateId !== undefined) updateData.email_template_id = updates.emailTemplateId;
      if (updates.documentTemplateId !== undefined) updateData.document_template_id = updates.documentTemplateId;
      if (updates.executionTime !== undefined) updateData.execution_time = updates.executionTime;

      const { data, error } = await supabase
        .from('automations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'activité
      try {
        await activityService.addActivity({
          type: 'automation',
          action: 'updated',
          title: 'Automatisation modifiée',
          description: `Automatisation "${data.name}" modifiée avec succès`,
          userId: user.id,
          priority: 'medium',
          category: 'success',
          entityId: id,
          entityType: 'automation',
          entityName: data.name,
          metadata: { automationId: id }
        });
      } catch (activityError) {
        console.warn('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      // Convertir vers le format de l'application
      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        type: data.type,
        frequency: data.frequency,
        nextExecution: new Date(data.next_execution),
        lastExecution: data.last_execution ? new Date(data.last_execution) : undefined,
        active: data.active,
        propertyId: data.property_id || undefined,
        emailTemplateId: data.email_template_id || undefined,
        documentTemplateId: data.document_template_id || undefined,
        executionTime: data.execution_time,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'automatisation:', error);
      throw error;
    }
  }

  async deleteAutomation(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer d'abord l'automatisation pour l'activité
      const automation = await this.getById(id);

      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Enregistrer l'activité
      if (automation) {
        try {
          await activityService.addActivity({
            type: 'automation',
            action: 'deleted',
            title: 'Automatisation supprimée',
            description: `Automatisation "${automation.name}" supprimée avec succès`,
            userId: user.id,
            priority: 'medium',
            category: 'success',
            entityId: id,
            entityType: 'automation',
            entityName: automation.name,
            metadata: { automationId: id }
          });
        } catch (activityError) {
          console.warn('Erreur lors de l\'enregistrement de l\'activité:', activityError);
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'automatisation:', error);
      return false;
    }
  }

  async toggleAutomation(id: string): Promise<boolean> {
    try {
      const automation = await this.getById(id);
      if (!automation) return false;

      const updated = await this.updateAutomation(id, { active: !automation.active });
      return updated !== null;
    } catch (error) {
      console.error('Erreur lors du basculement de l\'automatisation:', error);
      return false;
    }
  }

  async executeAutomation(id: string): Promise<boolean> {
    try {
      const automation = await this.getById(id);
      if (!automation || !automation.active) {
        console.log('Automatisation non trouvée ou inactive:', id);
        return false;
      }

      console.log('Exécution de l\'automatisation:', automation.name);

      // Préparer les pièces jointes si un template de document est configuré
      const attachments = [];
      let generatedDocumentId: string | null = null; // Garder une référence au document généré
      
      // Détermine l'ID du template de document à utiliser
      let documentTemplateId = automation.documentTemplateId;
      
      // Si c'est une automatisation de type "receipt" (génération de quittances) 
      // et qu'aucun document n'est sélectionné, utiliser le modèle de quittance par défaut
      if (automation.type === 'receipt' && !documentTemplateId) {
        documentTemplateId = '550e8400-e29b-41d4-a716-446655440003'; // ID du modèle de quittance de loyer
        console.log('Automatisation de quittance sans document configuré, utilisation du modèle par défaut');
        console.log('Template ID utilisé:', documentTemplateId);
      }
      
      if (documentTemplateId) {
        try {
          console.log('Génération et stockage du document pour l\'automatisation...');
          
          // Importer les services nécessaires
          const { documentGenerator } = await import('./documentGenerator');
          
          // Préparer les données pour la génération du document
          let documentData = {};
          let tenantInfo = null;
          
          // Si un bien est associé, récupérer ses informations pour le document
          if (automation.propertyId) {
            try {
              const { propertiesApi } = await import('./properties');
              const property = await propertiesApi.getProperty(automation.propertyId);
              
              if (property) {
                documentData = {
                  property_name: property.name,
                  property_address: property.address,
                  property_type: property.type,
                  rent_amount: property.rent.toString(),
                  charges_amount: property.charges.toString(),
                  total_amount: (property.rent + property.charges).toString()
                };
                
                if (property.tenant) {
                  tenantInfo = property.tenant;
                  documentData = {
                    ...documentData,
                    tenant_name: `${property.tenant.firstName} ${property.tenant.lastName}`,
                    tenant_email: property.tenant.email,
                    tenant_phone: property.tenant.phone || '',
                    lease_start_date: property.tenant.leaseStart.toLocaleDateString(),
                    lease_end_date: property.tenant.leaseEnd.toLocaleDateString()
                  };
                }
              }
            } catch (propertyError) {
              console.warn('Erreur lors de la récupération du bien pour le document:', propertyError);
            }
          }
          
          // Ajouter la date actuelle et informations contextuelles
          const now = new Date();
          const baseData = documentData as any; // Conversion pour accéder aux propriétés
          documentData = {
            ...documentData,
            current_date: now.toLocaleDateString(),
            month: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            landlord_name: 'Propriétaire',
            // Variables pour le template de quittance
            tenantName: baseData.tenant_name || 'Locataire',
            landlordName: 'Propriétaire',
            landlordAddress: 'Adresse du propriétaire',
            propertyAddress: baseData.property_address || 'Adresse du bien',
            rent: baseData.rent_amount || '0',
            charges: baseData.charges_amount || '0',
            total: baseData.total_amount || '0',
            period: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            paymentDate: now.toLocaleDateString(),
            documentDate: now.toLocaleDateString()
          };
          
          // Générer le document complet
          const generatedDocument = await documentGenerator.generateDocument({
            templateId: documentTemplateId,
            data: documentData,
            propertyId: automation.propertyId,
            tenantId: tenantInfo?.id
          });
          
          if (generatedDocument) {
            // Personnaliser le nom du document avec les informations contextuelles
            const customName = `${generatedDocument.name.split(' - ')[0]}_${tenantInfo ? tenantInfo.firstName + '_' + tenantInfo.lastName : 'Automatisation'}_${now.toISOString().split('T')[0]}`;
            
            // Mettre à jour le document avec des métadonnées d'automatisation
            const updatedDocument = {
              ...generatedDocument,
              name: customName,
              metadata: {
                ...generatedDocument.metadata,
                automationId: automation.id,
                propertyId: automation.propertyId,
                tenantId: tenantInfo?.id,
                generatedAt: now.toISOString(),
                automationName: automation.name
              }
            };
            
            // Stocker le document mis à jour
            console.log('Sauvegarde du document généré:', updatedDocument.name);
            await documentStorage.saveDocument(updatedDocument);
            generatedDocumentId = updatedDocument.id; // Sauvegarder l'ID du document généré
            console.log(`Document généré et stocké avec succès: ${updatedDocument.id}`);
            
            // Générer le PDF pour l'email
            const pdfContent = await documentGenerator.generatePDF(documentTemplateId, documentData);
            
            if (pdfContent) {
              // Ajouter le document aux pièces jointes de l'email
              attachments.push({
                filename: `${updatedDocument.name}.pdf`,
                content: pdfContent,
                contentType: 'application/pdf',
                encoding: 'base64'
              });
              
              console.log('Document PDF généré, stocké et ajouté en pièce jointe');
            } else {
              console.warn(`Impossible de générer le PDF pour le document ${updatedDocument.id}`);
            }
          } else {
            console.warn(`Impossible de générer le document pour le template ${documentTemplateId}`);
          }
        } catch (docError) {
          console.warn('Erreur lors de la génération/stockage du document:', docError);
          // Continuer sans pièce jointe au lieu d'échouer toute l'automatisation
        }
      }

      // Préparer les données pour le template d'email
      let emailData = {};
      
      // Si un bien est associé, récupérer ses informations
      if (automation.propertyId) {
        try {
          // Importer dynamiquement pour éviter les dépendances circulaires
          const { propertiesApi } = await import('./properties');
          const property = await propertiesApi.getProperty(automation.propertyId);
          
          if (property) {
            emailData = {
              ...emailData,
              property_name: property.name,
              property_address: property.address,
              property_type: property.type,
              rent_amount: property.rent.toString(),
              charges_amount: property.charges.toString(),
              total_amount: (property.rent + property.charges).toString()
            };
            
            // Si le bien a un locataire, ajouter ses informations
            if (property.tenant) {
              emailData = {
                ...emailData,
                tenant_name: `${property.tenant.firstName} ${property.tenant.lastName}`,
                tenant_email: property.tenant.email,
                tenant_phone: property.tenant.phone || '',
                lease_start_date: property.tenant.leaseStart.toLocaleDateString(),
                lease_end_date: property.tenant.leaseEnd.toLocaleDateString()
              };
            }
          }
        } catch (propertyError) {
          console.warn('Erreur lors de la récupération du bien:', propertyError);
        }
      }
      
      // Ajouter la date actuelle et le mois courant
      const now = new Date();
      emailData = {
        ...emailData,
        current_date: now.toLocaleDateString(),
        month: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        landlord_name: 'Propriétaire' // Valeur par défaut
      };

      // Traiter le template d'email si disponible
      let emailContent = automation.description || 'Automatisation exécutée';
      let emailSubject = automation.name;
      
      if (automation.emailTemplateId) {
        try {
          const processedTemplate = await emailTemplateService.processTemplate(automation.emailTemplateId, emailData);
          if (processedTemplate) {
            emailSubject = processedTemplate.subject;
            emailContent = processedTemplate.content;
          }
        } catch (templateError) {
          console.warn('Erreur lors du traitement du template d\'email:', templateError);
        }
      }

      // Déterminer le destinataire (utiliser le locataire si disponible)
      const recipient = (emailData as any).tenant_email || 'destinataire@example.com';

      // Créer les options d'email
      const emailOptions = {
        to: recipient,
        subject: emailSubject,
        html: emailContent,
        ...(attachments.length > 0 && { attachments })
      };

      // Essayer d'envoyer l'email via le service mail
      let emailSent = false;
      try {
        // Vérifier si le service mail est configuré
        const isConfigured = await mailService.isConfigured();
        if (isConfigured) {
          await mailService.sendEmail(emailOptions);
          emailSent = true;
        } else {
          // Sinon, utiliser le service local
          await localEmailService.sendEmail(emailOptions);
          emailSent = true;
        }
      } catch (emailError) {
        console.warn('Erreur lors de l\'envoi de l\'email, utilisation du service local:', emailError);
        try {
          // En cas d'erreur, utiliser le service local comme fallback
          await localEmailService.sendEmail(emailOptions);
          emailSent = true;
        } catch (fallbackError) {
          console.error('Échec de l\'envoi d\'email même avec le service local:', fallbackError);
          emailSent = false;
        }
      }

      // Si un document a été généré et l'email envoyé avec succès, mettre à jour le statut
      if (emailSent && generatedDocumentId) {
        try {
          console.log(`Tentative de mise à jour du statut du document ${generatedDocumentId} vers "sent"`);
          await documentStorage.updateDocumentStatus(generatedDocumentId, 'sent');
          console.log(`✅ Statut du document ${generatedDocumentId} mis à jour avec succès à "sent"`);
        } catch (statusError) {
          console.error('❌ Erreur lors de la mise à jour du statut du document:', statusError);
        }
      } else if (emailSent && !generatedDocumentId) {
        console.warn('⚠️ Email envoyé mais aucun document généré à mettre à jour');
      } else if (!emailSent && generatedDocumentId) {
        console.warn('⚠️ Document généré mais email non envoyé, statut non mis à jour');
      }

      // Mettre à jour la date de dernière exécution
      await this.updateAutomation(id, {
        lastExecution: new Date(),
        nextExecution: new Date(this.calculateNextExecution(automation.frequency))
      });

      console.log('Automatisation exécutée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'automatisation:', error);
      return false;
    }
  }

  async executeAllDueAutomations(): Promise<number> {
    try {
      const now = new Date();
      const dueAutomations = (await this.getActiveAutomations()).filter(
        automation => automation.nextExecution <= now
      );
      
      let successCount = 0;
      
      for (const automation of dueAutomations) {
        try {
          const success = await this.executeAutomation(automation.id);
          if (success) successCount++;
        } catch (error) {
          console.error(`Erreur lors de l'exécution de l'automatisation ${automation.id}:`, error);
        }
      }
      
      return successCount;
    } catch (error) {
      console.error('Erreur lors de l\'exécution des automatisations dues:', error);
      return 0;
    }
  }

  // Traiter la file d'attente des emails en mode local
  async processEmailQueue(): Promise<number> {
    try {
      return await localEmailService.processEmailQueue();
    } catch (error) {
      console.error('Erreur lors du traitement de la file d\'attente des emails:', error);
      return 0;
    }
  }

  private calculateNextExecution(frequency: string): string {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }

    return now.toISOString();
  }
}

// Créer une instance singleton
export const automationService = new AutomationService();
