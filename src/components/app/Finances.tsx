import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Download,
  Filter,
  PieChart,
  BarChart3,
  Search,
  FileText,
  Edit,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  CheckCircle,
  Repeat,
  Tag,
  FileDown,
  Building,
  Users,
  Settings,
  Loader2
} from 'lucide-react';
import { useFinances } from '../../hooks/useFinances';
import { useProperties } from '../../hooks/useProperties';
import { FinancialFlow } from '../../types/financial';
import FinancialFlowForm from './FinancialFlowForm';
import FinancialDashboard from './FinancialDashboard';
import FinancialReports from './FinancialReports';
import FinancialBudgets from './FinancialBudgets';
import FinancialSettings from './FinancialSettings';
import FinancialTaxes from './FinancialTaxes';
import BankingConfiguration from './BankingConfiguration';
import BankConnections from './BankConnections';

const Finances = () => {
  const {
    flows,
    categories,
    dashboardData,
    stats,
    loading,
    error,
    createFlow,
    updateFlow,
    deleteFlow,
    refreshDashboard
  } = useFinances();

  const { properties } = useProperties();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPropertyType, setFilterPropertyType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<{start: Date, end: Date} | null>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'semester' | 'year' | 'custom'>('month');
  
  const [showFlowForm, setShowFlowForm] = useState(false);
  const [editingFlow, setEditingFlow] = useState<FinancialFlow | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<FinancialFlow | null>(null);
  const [showFlowDetails, setShowFlowDetails] = useState(false);
  
  // Banking states
  const [bankingView, setBankingView] = useState('connections');

  // Function to handle date range changes
  const handleDateRangeChange = (period: 'month' | 'quarter' | 'year' | 'custom') => {
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStart, 1);
        end = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    setFilterDateRange({ start, end });
    setSelectedPeriod(period);
    refreshDashboard(start, end);
  };

  useEffect(() => {
    // Définir la plage de dates par défaut (mois en cours)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setFilterDateRange({ start: startOfMonth, end: endOfMonth });
    
    // Charger les données initiales
    refreshDashboard(startOfMonth, endOfMonth);
  }, []);

  const filteredFlows = flows.filter(flow => {
    // Filtre par terme de recherche
    const matchesSearch = 
      flow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flow.propertyName && flow.propertyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (flow.tenantName && flow.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtre par type
    const matchesType = filterType === 'all' || flow.type === filterType;
    
    // Filtre par catégorie
    const matchesCategory = filterCategory === 'all' || flow.category === filterCategory;
    
    // Filtre par statut
    const matchesStatus = filterStatus === 'all' || flow.status === filterStatus;
    
    // Filtre par type de bien
    const matchesPropertyType = filterPropertyType === 'all' || 
      (flow.propertyId && properties.find(p => p.id === flow.propertyId)?.type === filterPropertyType);
    
    // Filtre par plage de dates
    const matchesDateRange = !filterDateRange || 
      (flow.date >= filterDateRange.start && flow.date <= filterDateRange.end);
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesPropertyType && matchesDateRange;
  });

  // Trier les flux
  const sortedFlows = [...filteredFlows].sort((a, b) => {
    let aValue: any = a[sortBy as keyof FinancialFlow];
    let bValue: any = b[sortBy as keyof FinancialFlow];
    
    // Gestion spéciale pour les dates
    if (sortBy === 'date' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleAddFlow = () => {
    setEditingFlow(null);
    setShowFlowForm(true);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as any);
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let periodType: 'month' | 'quarter' | 'semester' | 'year' | 'custom' = 'month';
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        periodType = 'month';
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
        periodType = 'quarter';
        break;
      case 'semester':
        const currentSemester = Math.floor(now.getMonth() / 6);
        startDate = new Date(now.getFullYear(), currentSemester * 6, 1);
        endDate = new Date(now.getFullYear(), (currentSemester + 1) * 6, 0, 23, 59, 59);
        periodType = 'semester';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        periodType = 'year';
        break;
      case 'custom':
        // Pour les dates personnalisées, on garde les dates actuelles
        if (filterDateRange) {
          startDate = filterDateRange.start;
          endDate = filterDateRange.end;
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
        periodType = 'custom';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        periodType = 'month';
    }
    
    setSelectedPeriod(periodType);
    setFilterDateRange({ start: startDate, end: endDate });
    
    // Appliquer les filtres supplémentaires au tableau de bord
    refreshDashboard(startDate, endDate);
  };

  const handleEditFlow = (flow: FinancialFlow) => {
    setEditingFlow(flow);
    setShowFlowForm(true);
  };

  const handleViewFlow = (flow: FinancialFlow) => {
    setSelectedFlow(flow);
    setShowFlowDetails(true);
  };

  const handleDeleteFlow = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce flux financier ?')) {
      try {
        await deleteFlow(id);
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
      }
    }
  };

  const handleSaveFlow = async (flowData: Omit<FinancialFlow, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingFlow) {
        await updateFlow(editingFlow.id, flowData);
      } else {
        await createFlow(flowData);
      }
      setShowFlowForm(false);
      setEditingFlow(null);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  };

  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#808080';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Validé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderDashboardTab = () => (
    <FinancialDashboard 
      dashboardData={dashboardData}
      filterType={filterType}
      filterPropertyType={filterPropertyType}
      filterDateRange={filterDateRange}
      stats={stats}
      onDateRangeChange={handlePeriodChange}
      onFilterTypeChange={setFilterType}
      onFilterPropertyTypeChange={setFilterPropertyType}
      onAddFlow={handleAddFlow}
    />
  );

  const renderReportsTab = () => (
    <FinancialReports />
  );

  const renderBudgetsTab = () => (
    <FinancialBudgets />
  );

  const renderTaxesTab = () => (
    <FinancialTaxes />
  );

  const renderSettingsTab = () => (
    <FinancialSettings />
  );

  const renderBankingTab = () => {
    return (
      <div className="space-y-6">
        {/* Sous-navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setBankingView('connections')}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  bankingView === 'connections'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Mes Banques</span>
              </button>
              <button
                onClick={() => setBankingView('config')}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  bankingView === 'config'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Configuration</span>
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {bankingView === 'connections' ? (
              <BankConnections />
            ) : (
              <BankingConfiguration />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'transactions':
        return renderTransactionsTab();
      case 'reports':
        return renderReportsTab();
      case 'budgets':
        return renderBudgetsTab();
      case 'banking':
        return renderBankingTab();
      case 'taxes':
        return renderTaxesTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderDashboardTab();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données financières...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Statistics */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-600 rounded-xl shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
              <p className="text-gray-600 mt-1">
                Suivi financier et fiscal de votre portefeuille
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAddFlow}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter un flux</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
            >
              <Download className="h-5 w-5" />
              <span>Rapports</span>
            </button>
          </div>
        </div>

        {/* Financial Statistics Cards */}
        {dashboardData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardData.totalIncome?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Charges</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dashboardData.totalExpense?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bénéfice</p>
                  <p className={`text-2xl font-bold ${((dashboardData.totalIncome || 0) - (dashboardData.totalExpense || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {((dashboardData.totalIncome || 0) - (dashboardData.totalExpense || 0)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${((dashboardData.totalIncome || 0) - (dashboardData.totalExpense || 0)) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <PieChart className={`h-5 w-5 ${((dashboardData.totalIncome || 0) - (dashboardData.totalExpense || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">{flows.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <PieChart className="h-4 w-4" />
              <span>Tableau de bord</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Rapports</span>
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'budgets'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Budgets</span>
            </button>
            <button
              onClick={() => setActiveTab('banking')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'banking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Banques</span>
            </button>
            <button
              onClick={() => setActiveTab('taxes')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'taxes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileDown className="h-4 w-4" />
              <span>Fiscalité</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Flow Form Modal */}
      {showFlowForm && (
        <FinancialFlowForm
          flow={editingFlow}
          categories={categories}
          onSave={handleSaveFlow}
          onCancel={() => {
            setShowFlowForm(false);
            setEditingFlow(null);
          }}
          isOpen={showFlowForm}
        />
      )}

      {/* Flow Details Modal */}
      {showFlowDetails && selectedFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getCategoryColor(selectedFlow.category) + '20' }}>
                  {selectedFlow.type === 'income' ? (
                    <TrendingUp className="h-6 w-6" style={{ color: getCategoryColor(selectedFlow.category) }} />
                  ) : (
                    <TrendingDown className="h-6 w-6" style={{ color: getCategoryColor(selectedFlow.category) }} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedFlow.description}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFlow.status)}`}>
                      {getStatusLabel(selectedFlow.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedFlow.date.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowFlowDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Montant</p>
                <p className={`text-3xl font-bold ${
                  selectedFlow.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedFlow.type === 'income' ? '+' : '-'}{formatCurrency(selectedFlow.amount)}
                </p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Informations générales</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Catégorie:</span>
                      <span className="text-gray-900 font-medium">{getCategoryName(selectedFlow.category)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedFlow.type === 'income' ? 'Revenu' : 'Dépense'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-900">{selectedFlow.date.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Référence:</span>
                      <span className="text-gray-900">{selectedFlow.reference || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Méthode de paiement:</span>
                      <span className="text-gray-900">
                        {selectedFlow.paymentMethod === 'bank_transfer' ? 'Virement bancaire' :
                         selectedFlow.paymentMethod === 'cash' ? 'Espèces' :
                         selectedFlow.paymentMethod === 'check' ? 'Chèque' :
                         selectedFlow.paymentMethod === 'direct_debit' ? 'Prélèvement' : 
                         selectedFlow.paymentMethod || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Détails associés</h3>
                  <div className="space-y-3">
                    {selectedFlow.propertyName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bien:</span>
                        <span className="text-gray-900">{selectedFlow.propertyName}</span>
                      </div>
                    )}
                    {selectedFlow.tenantName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Locataire:</span>
                        <span className="text-gray-900">{selectedFlow.tenantName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Récurrent:</span>
                      <span className="text-gray-900">
                        {selectedFlow.recurring ? (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                            {selectedFlow.recurrenceFrequency === 'monthly' ? 'Mensuel' :
                             selectedFlow.recurrenceFrequency === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                          </span>
                        ) : 'Non'}
                      </span>
                    </div>
                    {selectedFlow.recurrenceEndDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fin de récurrence:</span>
                        <span className="text-gray-900">{selectedFlow.recurrenceEndDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Créé le:</span>
                      <span className="text-gray-900">{selectedFlow.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedFlow.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">{selectedFlow.notes}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedFlow.tags && selectedFlow.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFlow.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowFlowDetails(false);
                    handleEditFlow(selectedFlow);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => {
                    setShowFlowDetails(false);
                    handleDeleteFlow(selectedFlow.id);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Supprimer</span>
                </button>
              </div>
              <button
                onClick={() => setShowFlowDetails(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composants flèches pour le tri
const ArrowUp = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

const ArrowDown = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);

export default Finances;
