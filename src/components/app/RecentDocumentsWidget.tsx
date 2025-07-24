import React, { useState, useEffect } from 'react';
import { FileText, Mail, ChevronRight, Clock } from 'lucide-react';
import { documentStorage } from '../../lib/documentStorage';
import { GeneratedDocument } from '../../types/documents';

interface RecentDocumentsWidgetProps {
  setActiveTab: (tab: string) => void;
}

const RecentDocumentsWidget: React.FC<RecentDocumentsWidgetProps> = ({ setActiveTab }) => {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentStorage.getDocumentsList();
      setDocuments(docs);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'maintenant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}j`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} mois`;
  };

  // Séparer les documents en créés et signés/partagés
  const recentCreatedDocs = documents
    .filter(doc => doc.status === 'draft' || doc.status === 'sent')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  const recentSharedDocs = documents
    .filter(doc => doc.status === 'received' || doc.signedAt)
    .sort((a, b) => (b.signedAt || b.updatedAt).getTime() - (a.signedAt || a.updatedAt).getTime())
    .slice(0, 4);

  const handleViewAllDocuments = () => {
    setActiveTab('documents');
  };

  const getStatusColor = (doc: GeneratedDocument) => {
    if (doc.signedAt) return 'bg-green-500';
    switch (doc.status) {
      case 'received':
        return 'bg-green-500';
      case 'sent':
        return 'bg-blue-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (doc: GeneratedDocument) => {
    if (doc.signedAt) return 'signé';
    return doc.status;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
        {loading && (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des documents...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recent Documents Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-orange-500" />
              <h4 className="font-medium text-gray-900">Derniers documents créés</h4>
            </div>
            
            <div className="space-y-3">
              {recentCreatedDocs.length > 0 ? (
                recentCreatedDocs.slice(0, 2).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.type}</p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatTimeAgo(doc.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucun document créé récemment</p>
              )}
            </div>
          </div>
          
          {/* Shared Documents Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium text-gray-900">Derniers documents signés/partagés</h4>
            </div>
            
            <div className="space-y-3">
              {recentSharedDocs.length > 0 ? (
                recentSharedDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center flex-1">
                      <div className={`w-2 h-2 ${getStatusColor(doc)} rounded-full mr-2`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{getStatusText(doc)}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatTimeAgo(doc.signedAt || doc.updatedAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucun document signé récemment</p>
              )}
            </div>
          </div>
          
          {/* Total Documents Count */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{documents.length} document{documents.length > 1 ? 's' : ''} au total</span>
              <button 
                onClick={handleViewAllDocuments}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <span>Voir mes documents</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentDocumentsWidget;
