import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Send,
  CheckCircle,
  AlertCircle,
  Trash2,
  FileDown
} from 'lucide-react';
import { DocumentTemplate, GeneratedDocument, DocumentStatus } from '../../types/documents';
import { documentTemplates } from '../../lib/documentTemplates';
import { documentStorage } from '../../lib/documentStorage';
import { useProperties } from '../../hooks/useProperties';
import { useTenants } from '../../hooks/useTenants';
import DocumentForm from './DocumentForm';
import DocumentViewer from './DocumentViewer';

const DocumentGenerator = () => {
  const { properties } = useProperties();
  const { tenants } = useTenants();
  
  const [_documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [_templates] = useState<DocumentTemplate[]>(documentTemplates);
  // const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null);
  const [editingDocument, setEditingDocument] = useState<GeneratedDocument | null>(null);
  // const [showEmailTemplateEditor, setShowEmailTemplateEditor] = useState(false);
  const [viewMode, setViewMode] = useState<'templates' | 'documents'>('templates');

  useEffect(() => {
    loadDocuments();
    
    // Rafraîchir les documents toutes les 30 secondes pour capturer les changements automatiques
    const interval = setInterval(() => {
      loadDocuments();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDocuments = async () => {
    try {
      try {
        const docs = await documentStorage.getDocumentsList();
        setDocuments(docs);
      } catch (error) {
        // Si l'erreur est liée à une connexion Supabase, utiliser les données de démonstration
        if (error instanceof Error && 
            (error.message.includes('timeout') || 
             error.message.includes('Failed to fetch') ||
             error.message.includes('connect error'))) {
          console.warn('Utilisation des documents de démonstration en raison d\'une erreur de connexion:', error.message);
          
          // Créer des documents de démonstration
          const demoDocuments: GeneratedDocument[] = [
            {
              id: 'doc_1',
              templateId: 'lease-contract',
              name: 'Contrat de bail - Appartement Bastille',
              type: 'lease',
              status: 'received',
              propertyId: '1',
              tenantId: '1',
              userId: 'current-user',
              data: {},
              content: '<div class="document-header"><h1>CONTRAT DE BAIL</h1></div>',
              signatures: [
                {
                  id: 'sig_1',
                  signerName: 'Marie Martin',
                  signerEmail: 'marie.martin@email.com',
                  signerRole: 'tenant',
                  signedAt: new Date('2023-08-20')
                }
              ],
              createdAt: new Date('2023-08-15'),
              updatedAt: new Date('2023-08-20'),
              signedAt: new Date('2023-08-20'),
              metadata: {
                version: '1.0',
                generatedBy: 'EasyBail Document Generator',
                legalFramework: 'Loi du 6 juillet 1989, Loi ALUR'
              }
            },
            {
              id: 'doc_2',
              templateId: 'inventory-report',
              name: 'État des lieux d\'entrée - Appartement Bastille',
              type: 'inventory',
              status: 'received',
              propertyId: '1',
              tenantId: '1',
              userId: 'current-user',
              data: {},
              content: '<div class="document-header"><h1>ÉTAT DES LIEUX</h1></div>',
              signatures: [],
              createdAt: new Date('2023-08-20'),
              updatedAt: new Date('2023-08-20'),
              signedAt: new Date('2023-08-20'),
              metadata: {
                version: '1.0',
                generatedBy: 'EasyBail Document Generator',
                legalFramework: 'Loi du 6 juillet 1989, Décret n°2016-382'
              }
            },
            {
              id: 'doc_3',
              templateId: 'rent-receipt',
              name: 'Quittance Novembre 2024',
              type: 'receipt',
              status: 'received',
              propertyId: '1',
              tenantId: '1',
              userId: 'current-user',
              data: {},
              content: '<div class="document-header"><h1>QUITTANCE DE LOYER</h1></div>',
              signatures: [],
              createdAt: new Date('2024-11-01'),
              updatedAt: new Date('2024-11-05'),
              signedAt: new Date('2024-11-05'),
              metadata: {
                version: '1.0',
                generatedBy: 'EasyBail Document Generator',
                legalFramework: 'Article 21 de la loi du 6 juillet 1989'
              }
            }
          ];
          
          setDocuments(demoDocuments);
        } else {
          console.error('Erreur lors du chargement des documents:', error);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  };

  const handleCreateDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowDocumentForm(true);
  };

  const handleViewDocument = (document: GeneratedDocument) => {
    setSelectedDocument(document);
    setShowDocumentPreview(true);
  };

  const handleEditDocument = (document: GeneratedDocument) => {
    // Trouver le template associé au document
    const template = documentTemplates.find(t => t.id === document.templateId);
    if (template) {
      setSelectedTemplate(template);
      setEditingDocument(document);
      setShowDocumentForm(true);
    } else {
      console.error('Template non trouvé pour le document:', document.templateId);
      alert('Impossible de modifier ce document : template non trouvé');
    }
  };

  const handleDocumentSaved = async (documentData: any) => {
    try {
      const isEditing = editingDocument !== null;
      console.log(`💾 ${isEditing ? 'Modification' : 'Sauvegarde'} du document en cours...`);
      
      // Créer l'objet document avec l'ID
      const document = {
        id: editingDocument?.id || crypto.randomUUID(),
        ...documentData,
        templateId: selectedTemplate!.id,
        createdAt: editingDocument?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: editingDocument?.status || 'draft' as DocumentStatus
      };

      console.log('📝 Document préparé:', document);
      
      // Générer et stocker le PDF
      await generateAndStorePDF(document);
      
      console.log('📄 PDF généré et stocké');
      
      // Sauvegarder le document (Supabase + localStorage)
      await documentStorage.saveDocument(document);
      
      console.log('✅ Document sauvegardé avec succès');
      
      await loadDocuments();
      setShowDocumentForm(false);
      setSelectedTemplate(null);
      setEditingDocument(null);
      
      // Afficher un message de succès
      alert(`Document "${document.name}" ${isEditing ? 'modifié' : 'créé'} et sauvegardé avec succès !`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert(`Erreur lors de la sauvegarde du document: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Fonction pour générer et stocker un PDF à partir du document
  const generateAndStorePDF = async (generatedDoc: GeneratedDocument) => {
    try {
      console.log('Génération PDF pour:', generatedDoc.name);
      
      // Créer un élément temporaire pour le rendu HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div class="document-header" style="border-bottom: 2px solid #333; margin-bottom: 30px; padding-bottom: 15px; text-align: center;">
          <div class="document-title" style="font-size: 18pt; font-weight: bold; margin-bottom: 10px; color: #333;">${generatedDoc.name}</div>
          <div class="document-meta" style="font-size: 10pt; color: #666; margin-bottom: 5px;">Type: ${generatedDoc.type}</div>
          <div class="document-meta" style="font-size: 10pt; color: #666; margin-bottom: 5px;">Statut: ${generatedDoc.status}</div>
          <div class="document-meta" style="font-size: 10pt; color: #666; margin-bottom: 5px;">Créé le: ${generatedDoc.createdAt.toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="document-content" style="margin: 30px 0; text-align: justify; line-height: 1.8;">
          ${generatedDoc.content}
        </div>
        ${generatedDoc.signatures.length > 0 ? `
        <div class="signature-section" style="margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px;">
          <div class="signature-title" style="font-weight: bold; margin-bottom: 15px; font-size: 14pt;">Signatures :</div>
          ${generatedDoc.signatures.map(sig => 
            `<div class="signature-item" style="margin-bottom: 10px; padding: 5px 0;">
              <strong>${sig.signerName}</strong> (${sig.signerRole}): 
              ${sig.signedAt ? 'Signé le ' + sig.signedAt.toLocaleDateString('fr-FR') : 'En attente de signature'}
            </div>`
          ).join('')}
        </div>` : ''}
      `;
      
      // Styles pour le rendu PDF
      tempDiv.style.cssText = `
        position: fixed !important;
        top: -99999px !important;
        left: -99999px !important;
        width: 794px !important;
        height: auto !important;
        padding: 60px !important;
        margin: 0 !important;
        font-family: 'Times New Roman', serif !important;
        font-size: 12pt !important;
        line-height: 1.6 !important;
        color: #000 !important;
        background-color: #fff !important;
        overflow: visible !important;
        z-index: -9999 !important;
        box-sizing: border-box !important;
      `;
      
      document.body.appendChild(tempDiv);
      
      // Attendre que le DOM soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Générer le PDF avec html2canvas + jsPDF
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: tempDiv.scrollHeight,
        logging: false,
        removeContainer: false
      });
      
      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculer les dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculer le ratio pour maintenir les proportions
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const finalWidth = (imgWidth * 0.264583) * ratio;
      const finalHeight = (imgHeight * 0.264583) * ratio;
      
      // Ajouter l'image au PDF
      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
      
      // Stocker le PDF dans les métadonnées du document
      const pdfData = pdf.output('datauristring');
      generatedDoc.metadata.pdfData = pdfData;
      
      // Nettoyer l'élément temporaire
      document.body.removeChild(tempDiv);
      
      console.log('PDF généré et stocké dans les métadonnées');
      
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error);
      
      // Nettoyer en cas d'erreur
      const tempElements = document.querySelectorAll('[style*="position: fixed"][style*="-99999px"]');
      tempElements.forEach(el => el.remove());
      
      // Ne pas empêcher la sauvegarde du document en cas d'erreur PDF
      console.warn('Le document sera sauvegardé sans PDF pré-généré');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        // Supprimer du stockage principal
        await documentStorage.deleteDocument(documentId);
        
        await loadDocuments();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDownloadPDF = async (generatedDocToDownload: GeneratedDocument) => {
    try {
      console.log('Génération et téléchargement PDF pour:', generatedDocToDownload.name);
      
      // Si des données PDF sont déjà stockées, les utiliser
      if (generatedDocToDownload.metadata.pdfData) {
        const link = document.createElement('a');
        link.href = generatedDocToDownload.metadata.pdfData;
        link.download = `${generatedDocToDownload.name}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('PDF téléchargé depuis le cache');
        
        // Mettre à jour le statut du document en "downloaded"
        await documentStorage.updateDocumentStatus(generatedDocToDownload.id, 'downloaded');
        await loadDocuments();
        
        return;
      }
      
      // Créer un élément temporaire pour le rendu HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div class="document-header" style="border-bottom: 2px solid #333; margin-bottom: 30px; padding-bottom: 15px; text-align: center;">
          <div class="document-title" style="font-size: 18pt; font-weight: bold; margin-bottom: 10px; color: #333;">${generatedDocToDownload.name}</div>
          <div class="document-meta" style="font-size: 10pt; color: #666; margin-bottom: 5px;">Type: ${generatedDocToDownload.type}</div>
          <div class="document-meta" style="font-size: 10pt; color: #666; margin-bottom: 5px;">Statut: ${generatedDocToDownload.status}</div>
          <div class="document-meta" style="font-size: 10pt; color: #666; margin-bottom: 5px;">Créé le: ${generatedDocToDownload.createdAt.toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="document-content" style="margin: 30px 0; text-align: justify; line-height: 1.8;">
          ${generatedDocToDownload.content}
        </div>
        ${generatedDocToDownload.signatures.length > 0 ? `
        <div class="signature-section" style="margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px;">
          <div class="signature-title" style="font-weight: bold; margin-bottom: 15px; font-size: 14pt;">Signatures :</div>
          ${generatedDocToDownload.signatures.map(sig => 
            `<div class="signature-item" style="margin-bottom: 10px; padding: 5px 0;">
              <strong>${sig.signerName}</strong> (${sig.signerRole}): 
              ${sig.signedAt ? 'Signé le ' + sig.signedAt.toLocaleDateString('fr-FR') : 'En attente de signature'}
            </div>`
          ).join('')}
        </div>` : ''}
      `;
      
      // Styles pour le rendu PDF
      tempDiv.style.cssText = `
        position: fixed !important;
        top: -99999px !important;
        left: -99999px !important;
        width: 794px !important;
        height: auto !important;
        padding: 60px !important;
        margin: 0 !important;
        font-family: 'Times New Roman', serif !important;
        font-size: 12pt !important;
        line-height: 1.6 !important;
        color: #000 !important;
        background-color: #fff !important;
        overflow: visible !important;
        z-index: -9999 !important;
        box-sizing: border-box !important;
      `;
      
      document.body.appendChild(tempDiv);
      
      // Attendre que le DOM soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Générer le PDF avec html2canvas + jsPDF
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: tempDiv.scrollHeight,
        logging: false,
        removeContainer: false
      });
      
      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculer les dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculer le ratio pour maintenir les proportions
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const finalWidth = (imgWidth * 0.264583) * ratio;
      const finalHeight = (imgHeight * 0.264583) * ratio;
      
      // Ajouter l'image au PDF
      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
      
      // Télécharger le PDF
      const fileName = `${generatedDocToDownload.name}.pdf`.replace(/[^a-zA-Z0-9\-_\s]/g, '');
      pdf.save(fileName);
      
      // Nettoyer l'élément temporaire
      document.body.removeChild(tempDiv);
      
      console.log('PDF généré et téléchargé avec succès:', fileName);
      
      // Mettre à jour le statut du document en "downloaded"
      await documentStorage.updateDocumentStatus(generatedDocToDownload.id, 'downloaded');
      await loadDocuments();
      
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
      
      // Nettoyer en cas d'erreur
      const tempElements = document.querySelectorAll('[style*="position: fixed"][style*="-99999px"]');
      tempElements.forEach(el => el.remove());
    }
  };

  // Functions commented out to resolve compilation errors
  // DOCX generation functionality temporarily disabled

  // All complex functions temporarily commented out for compilation

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'downloaded':
        return <FileDown className="h-4 w-4 text-purple-600" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received':
        return 'Reçu';
      case 'sent':
        return 'Envoyé';
      case 'downloaded':
        return 'Téléchargé';
      case 'draft':
        return 'Brouillon';
      case 'archived':
        return 'Archivé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'lease': 'Contrat de bail',
      'inventory': 'État des lieux',
      'receipt': 'Quittance',
      'notice': 'Préavis',
      'insurance': 'Assurance',
      'guarantee': 'Caution',
      'amendment': 'Avenant',
      'termination': 'Résiliation',
      'renewal': 'Renouvellement',
      'other': 'Autre'
    };
    return labels[type] || type;
  };

  // Calculate real document statistics
  const documentStats = {
    total: _documents.length,
    draft: _documents.filter(d => d.status === 'draft').length,
    pending: _documents.filter(d => d.status === 'sent').length,
    sent: _documents.filter(d => d.status === 'sent').length,
    signed: _documents.filter(d => d.status === 'received').length
  };

  // Filter documents and templates based on search and filters
  const filteredDocuments = _documents.filter(document => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || document.type === filterType;
    const matchesStatus = filterStatus === 'all' || document.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredTemplates = _templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesType;
  });

  // Fonction pour envoyer un document par email
  const handleSendForSignature = async (document: GeneratedDocument) => {
    try {
      // Créer un lien mailto avec le document en pièce jointe
      const subject = encodeURIComponent(`Document: ${document.name}`);
      const body = encodeURIComponent(`Veuillez trouver ci-joint le document "${document.name}" créé le ${document.createdAt.toLocaleDateString()}.`);
      
      // Ouvrir le client email par défaut
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      
      console.log('Email client ouvert pour:', document.name);
      
      // Mettre à jour le statut du document en "sent"
      await documentStorage.updateDocumentStatus(document.id, 'sent');
      await loadDocuments();
      
      // Déclencher un rafraîchissement supplémentaire après un court délai pour s'assurer que la mise à jour est visible
      setTimeout(() => {
        loadDocuments();
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      alert('Erreur lors de l\'ouverture du client email');
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Enhanced Header with Statistics */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
                <p className="text-gray-600 mt-1">
                  Créez et gérez vos documents locatifs en toute simplicité
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('templates')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'templates'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Modèles
                </button>
                <button
                  onClick={() => setViewMode('documents')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'documents'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mes documents
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {viewMode === 'documents' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Brouillons</p>
                    <p className="text-2xl font-bold text-gray-600">{documentStats.draft}</p>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Edit className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documents envoyés</p>
                    <p className="text-2xl font-bold text-green-600">{documentStats.sent}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Send className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  viewMode === 'templates' ? "Rechercher par nom, type ou description..." : 
                  "Rechercher par nom, type ou statut..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="lease">Contrats de bail</option>
                <option value="inventory">États des lieux</option>
                <option value="receipt">Quittances</option>
                <option value="notice">Préavis</option>
                <option value="insurance">Assurances</option>
                <option value="other">Autres</option>
              </select>
              
              {viewMode === 'documents' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillons</option>
                  <option value="sent">Envoyés</option>
                  <option value="received">Reçus</option>
                  <option value="downloaded">Téléchargés</option>
                  <option value="archived">Archivés</option>
                  <option value="cancelled">Annulés</option>
                </select>
              )}
              
              <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {viewMode === 'templates' 
                ? `${filteredTemplates.length} modèle${filteredTemplates.length > 1 ? 's' : ''}`
                : `${filteredDocuments.length} document${filteredDocuments.length > 1 ? 's' : ''}`
              }
              {searchTerm && ` trouvé${(viewMode === 'templates' ? filteredTemplates.length : filteredDocuments.length) > 1 ? 's' : ''} pour "${searchTerm}"`}
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        {viewMode === 'templates' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template, index) => (
                <div 
                  key={template.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105 animate-in fade-in-0 slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">{getTypeLabel(template.type)}</p>
                      </div>
                    </div>
                    {template.isRequired && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Conformité légale :</p>
                    <div className="flex flex-wrap gap-1">
                      {template.legalCompliance.map((law: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {law}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCreateDocument(template)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Créer le document</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Empty State for Templates */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-16 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'Aucun modèle trouvé' : 'Aucun modèle disponible'}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {searchTerm
                    ? `Aucun modèle ne correspond à votre recherche "${searchTerm}". Essayez avec d'autres mots-clés.`
                    : 'Les modèles de documents seront bientôt disponibles.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Créer un modèle
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Documents List */}
        {viewMode === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Document</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Bien/Locataire</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Date création</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDocuments.map((document, index) => {
                      const property = properties.find(p => p.id === document.propertyId);
                      const tenant = tenants.find(t => t.id === document.tenantId);
                      
                      return (
                        <tr 
                          key={document.id} 
                          className="hover:bg-gray-50 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{document.name}</p>
                                {document.signedAt && (
                                  <p className="text-sm text-gray-500">
                                    Signé le {document.signedAt.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getTypeLabel(document.type)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(document.status)}
                              <span className={`text-sm font-medium ${
                                document.status === 'received' ? 'text-green-600' :
                                document.status === 'sent' ? 'text-blue-600' :
                                document.status === 'draft' ? 'text-gray-600' :
                                'text-red-600'
                              }`}>
                                {getStatusLabel(document.status)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              {property && (
                                <div>
                                  <p className="font-medium text-gray-900">{property.name}</p>
                                  <p className="text-gray-500">{property.address}</p>
                                </div>
                              )}
                              {tenant && (
                                <p className="text-gray-600 mt-1">
                                  {tenant.firstName} {tenant.lastName}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-900">
                              {document.createdAt.toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewDocument(document)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Voir"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadPDF(document)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Télécharger PDF"
                              >
                                <FileDown className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSendForSignature(document)}
                                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Envoyer par email"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditDocument(document)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(document.id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Empty State for Documents */}
            {filteredDocuments.length === 0 && (
              <div className="text-center py-16 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'Aucun document trouvé' : 'Aucun document'}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {searchTerm
                    ? `Aucun document ne correspond à votre recherche "${searchTerm}". Essayez avec d'autres mots-clés.`
                    : 'Commencez par créer votre premier document à partir d\'un modèle.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setViewMode('templates')}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Voir les modèles
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Document Form Modal */}
        {showDocumentForm && selectedTemplate && (
          <DocumentForm
            template={selectedTemplate}
            properties={properties}
            tenants={tenants}
            onSave={handleDocumentSaved}
            onCancel={() => {
              setShowDocumentForm(false);
              setSelectedTemplate(null);
              setEditingDocument(null);
            }}
            isOpen={showDocumentForm}
            initialData={editingDocument}
          />
        )}

        {/* Document Viewer Modal */}
        {showDocumentPreview && selectedDocument && (
          <DocumentViewer
            document={selectedDocument}
            onClose={() => {
              setShowDocumentPreview(false);
              setSelectedDocument(null);
            }}
            isOpen={showDocumentPreview}
          />
        )}
      </div>
    </>
  );
};

export default DocumentGenerator;
