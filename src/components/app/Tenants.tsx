import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Clock,
  MapPin,
  Loader2
} from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { useTenants } from '../../hooks/useTenants';
import TenantForm from './TenantForm';
import TenantDetails from './TenantDetails';

const Tenants = () => {
  const { properties, loading: propertiesLoading, refreshProperties } = useProperties();
  const { 
    tenants, 
    loading, 
    error, 
    createTenant, 
    updateTenant, 
    deleteTenant,
    refreshTenants 
  } = useTenants();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'terminated':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'pending':
        return 'En attente';
      case 'inactive':
        return 'Inactif';
      case 'terminated':
        return 'Résilié';
      default:
        return status;
    }
  };

  const getPropertyDetails = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property || null;
  };
  const handleAddTenant = () => {
    setEditingTenant(null);
    setShowTenantForm(true);
  };

  const handleEditTenant = (tenant: any) => {
    setEditingTenant(tenant);
    setShowTenantForm(true);
  };

  const handleViewTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setShowTenantDetails(true);
  };

  const handleDeleteTenant = (tenantId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce locataire ?')) {
      deleteTenant(tenantId).catch(err => {
        console.error('Erreur lors de la suppression:', err);
      });
    }
  };

  const handleSaveTenant = async (tenantData: any) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      console.log('🔄 Tentative de sauvegarde du locataire:', tenantData);
      
      // Vérifications préliminaires
      if (!tenantData.propertyId) {
        throw new Error('Aucune propriété sélectionnée');
      }
      
      if (!tenantData.firstName || !tenantData.lastName || !tenantData.email) {
        throw new Error('Les informations personnelles sont incomplètes');
      }
      
      if (!tenantData.leaseStart || !tenantData.leaseEnd) {
        throw new Error('Les dates de bail sont manquantes');
      }
      
      if (tenantData.rent <= 0) {
        throw new Error('Le loyer doit être supérieur à 0');
      }
      
      // Validation des dates
      const startDate = new Date(tenantData.leaseStart);
      const endDate = new Date(tenantData.leaseEnd);
      
      if (startDate >= endDate) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
      
      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tenantData.email)) {
        throw new Error('Format d\'email invalide');
      }
      
      if (editingTenant) {
        console.log('📝 Mise à jour du locataire existant:', editingTenant.id);
        await updateTenant(editingTenant.id, tenantData);
        console.log('✅ Locataire mis à jour avec succès');
      } else {
        console.log('➕ Création d\'un nouveau locataire');
        await createTenant(tenantData);
        console.log('✅ Locataire créé avec succès');
      }
      
      // Fermer le formulaire et rafraîchir
      setShowTenantForm(false);
      setEditingTenant(null);
      
      // Rafraîchir les données après un court délai
      setTimeout(async () => {
        try {
          await Promise.all([
            refreshTenants(),
            refreshProperties()
          ]);
          console.log('🔄 Données rafraîchies avec succès');
          
          // Afficher un message de succès
          const successMessage = editingTenant ? 'Locataire mis à jour avec succès!' : 'Locataire créé avec succès!';
          
          // Créer un élément de notification temporaire
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
          notification.textContent = successMessage;
          document.body.appendChild(notification);
          
          // Supprimer la notification après 3 secondes
          setTimeout(() => {
            notification.remove();
          }, 3000);
          
        } catch (refreshError) {
          console.warn('Erreur lors du rafraîchissement:', refreshError);
        }
      }, 500);
      
    } catch (err) {
      console.error('❌ Erreur lors de la sauvegarde:', err);
      
      let errorMessage = 'Une erreur inconnue est survenue';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      // Gestion des erreurs spécifiques Supabase
      if (errorMessage.includes('duplicate key value')) {
        errorMessage = 'Un locataire avec cet email existe déjà';
      } else if (errorMessage.includes('violates foreign key constraint')) {
        errorMessage = 'La propriété sélectionnée n\'existe pas ou n\'est pas accessible';
      } else if (errorMessage.includes('not-null constraint')) {
        errorMessage = 'Certains champs obligatoires sont manquants';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      }
      
      setSaveError(errorMessage);
      alert(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const pendingTenants = tenants.filter(t => t.status === 'pending').length;
  const totalRent = tenants
    .filter(t => t.status === 'active')
    .reduce((sum, t) => sum + t.rent, 0);

  const upcomingLeaseEnds = tenants
    .filter(t => t.status === 'active')
    .filter(t => {
      const endDate = new Date(t.leaseEnd);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      return endDate <= threeMonthsFromNow;
    });

  // Afficher un loader si les données sont en cours de chargement
  if (loading || propertiesLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des locataires...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Affichage des erreurs de sauvegarde */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur de sauvegarde
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{saveError}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setSaveError(null)}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Header with Statistics */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Locataires</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos locataires et leurs baux en toute simplicité
              </p>
            </div>
          </div>
          <button
            onClick={handleAddTenant}
            disabled={loading || properties.length === 0}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter un locataire
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{activeTenants}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingTenants}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus/mois</p>
                <p className="text-2xl font-bold text-blue-600">{totalRent.toLocaleString()}€</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fins de bail</p>
                <p className="text-2xl font-bold text-orange-600">{upcomingLeaseEnds.length}</p>
                <p className="text-xs text-gray-500">Dans 3 mois</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No Properties Warning */}
      {properties.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-yellow-800 font-medium">Aucun bien disponible</p>
            <p className="text-yellow-700 text-sm">
              Vous devez d'abord créer des biens immobiliers avant d'ajouter des locataires.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {upcomingLeaseEnds.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="font-medium text-orange-900">Fins de bail à venir</h3>
              <p className="text-orange-700 text-sm">
                {upcomingLeaseEnds.length} bail(s) se termine(nt) dans les 3 prochains mois
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou email..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="terminated">Résiliés</option>
            </select>
            <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredTenants.length} locataire{filteredTenants.length > 1 ? 's' : ''} 
            {searchTerm && ` trouvé${filteredTenants.length > 1 ? 's' : ''} pour "${searchTerm}"`}
          </p>
          {filteredTenants.length > 0 && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {activeTenants} actif{activeTenants > 1 ? 's' : ''}
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                {pendingTenants} en attente
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tenants Display */}
      <div className="space-y-6">
        {/* Tenants Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Locataire</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Bien</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Bail</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Loyer</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTenants.map((tenant, index) => {
                  const propertyDetails = getPropertyDetails(tenant.propertyId);
                  return (
                  <tr 
                    key={tenant.id} 
                    className="hover:bg-gray-50 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {tenant.firstName} {tenant.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Depuis le {new Date(tenant.leaseStart).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {propertyDetails ? (
                        <div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {propertyDetails.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            {propertyDetails.address}
                          </p>
                          <div className="flex items-center space-x-2 mt-1 ml-6">
                            <span className="text-xs text-gray-500">
                              {propertyDetails.surface}m² • {propertyDetails.rooms} pièces
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <span className="text-sm text-red-600">
                            Bien introuvable
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                        {getStatusLabel(tenant.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">
                            {new Date(tenant.leaseEnd).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.ceil((new Date(tenant.leaseEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours restants
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{tenant.rent}€</div>
                        <div className="text-xs text-gray-500">
                          Dépôt: {tenant.deposit}€
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`mailto:${tenant.email}`)}
                          className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Envoyer un email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.open(`tel:${tenant.phone}`)}
                          className="p-1 text-gray-600 hover:text-green-600 transition-colors"
                          title="Appeler"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewTenant(tenant)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditTenant(tenant)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(tenant.id)}
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

        {/* Enhanced Empty State */}
        {filteredTenants.length === 0 && (
          <div className="text-center py-16 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Aucun locataire trouvé' : 'Aucun locataire'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm
                ? `Aucun locataire ne correspond à votre recherche "${searchTerm}". Essayez avec d'autres mots-clés.`
                : 'Commencez par ajouter votre premier locataire pour démarrer la gestion de vos baux.'}
            </p>
            {!searchTerm ? (
              <button
                onClick={handleAddTenant}
                disabled={properties.length === 0}
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter votre premier locataire
              </button>
            ) : (
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tenant Form Modal */}
      <TenantForm
        tenant={editingTenant}
        properties={properties}
        onSave={handleSaveTenant}
        onCancel={() => {
          setShowTenantForm(false);
          setEditingTenant(null);
          setSaveError(null);
        }}
        isOpen={showTenantForm}
        isSaving={isSaving}
      />

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <TenantDetails
          tenant={selectedTenant}
          property={getPropertyDetails(selectedTenant.propertyId) || undefined}
          onEdit={() => {
            setShowTenantDetails(false);
            handleEditTenant(selectedTenant);
          }}
          onDelete={() => {
            setShowTenantDetails(false);
            handleDeleteTenant(selectedTenant.id);
          }}
          onClose={() => {
            setShowTenantDetails(false);
            setSelectedTenant(null);
          }}
          isOpen={showTenantDetails}
        />
      )}
    </div>
  );
};

export default Tenants;
