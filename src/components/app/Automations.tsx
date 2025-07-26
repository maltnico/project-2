import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Search, 
  Filter,
  Clock,
  Play,
  Pause,
  Edit,
  Trash2,
  Settings,
  Mail,
  FileText,
  DollarSign,
  Home,
  Bell,
  Loader2
} from 'lucide-react';

import { Automation } from '../../types';
import { useAutomations } from '../../hooks/useAutomations';
import AutomationForm from './AutomationForm';

// Hook pour le timer
const useCountdown = (targetDate: Date | null) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

const Automations = () => {
  const { 
    automations, 
    createAutomation, 
    updateAutomation, 
    deleteAutomation, 
    toggleAutomation, 
    executeAutomation
  } = useAutomations();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAutomationForm, setShowAutomationForm] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [executingAutomation, setExecutingAutomation] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{id: string, success: boolean} | null>(null);

  const filteredAutomations = automations.filter(automation => {
    const matchesSearch = (automation.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (automation.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || automation.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && automation.active) ||
                         (filterStatus === 'inactive' && !automation.active);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculer la prochaine exécution automatique
  const nextAutomaticExecution = React.useMemo(() => {
    const activeAutomations = automations.filter(a => a.active);
    if (activeAutomations.length === 0) return null;
    
    const nextAutomation = activeAutomations.reduce((earliest, automation) => {
      return !earliest || automation.nextExecution < earliest.nextExecution 
        ? automation 
        : earliest;
    }, null as Automation | null);
    
    return nextAutomation ? nextAutomation.nextExecution : null;
  }, [automations]);

  // Trouver l'automatisation qui sera exécutée en prochaine
  const nextAutomation = React.useMemo(() => {
    const activeAutomations = automations.filter(a => a.active);
    if (activeAutomations.length === 0) return null;
    
    return activeAutomations.reduce((earliest, automation) => {
      return !earliest || automation.nextExecution < earliest.nextExecution 
        ? automation 
        : earliest;
    }, null as Automation | null);
  }, [automations]);

  const timeLeft = useCountdown(nextAutomaticExecution);

  const handleAddAutomation = () => {
    setEditingAutomation(null);
    setShowAutomationForm(true);
  };

  const handleEditAutomation = (automation: Automation) => {
    setEditingAutomation(automation);
    setShowAutomationForm(true);
  };

  const handleSaveAutomation = async (automationData: Omit<Automation, 'id' | 'createdAt'>) => {
    try {
      if (editingAutomation) {
        await updateAutomation(editingAutomation.id, automationData);
      } else {
        await createAutomation(automationData);
      }
      setShowAutomationForm(false);
      setEditingAutomation(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // Afficher l'erreur à l'utilisateur
      alert(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'rent_review':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'insurance':
        return <Home className="h-5 w-5 text-purple-600" />;
      case 'maintenance':
        return <Settings className="h-5 w-5 text-orange-600" />;
      case 'reminder':
        return <Bell className="h-5 w-5 text-red-600" />;
      case 'notice':
        return <Mail className="h-5 w-5 text-yellow-600" />;
      default:
        return <Zap className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'receipt': 'Quittances',
      'rent_review': 'Révision loyer',
      'insurance': 'Assurance',
      'maintenance': 'Maintenance',
      'reminder': 'Rappels',
      'notice': 'Préavis'
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      'daily': 'Quotidien',
      'weekly': 'Hebdomadaire',
      'monthly': 'Mensuel',
      'quarterly': 'Trimestriel',
      'yearly': 'Annuel'
    };
    return labels[frequency] || frequency;
  };

  const handleToggleAutomation = async (id: string) => {
    try {
      await toggleAutomation(id);
    } catch (error) {
      console.error('Erreur lors de la modification de l\'automatisation:', error);
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) {
      try {
        await deleteAutomation(id);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'automatisation:', error);
      }
    }
  };

  const handleExecuteNow = async (id: string) => {
    const automation = automations.find(a => a.id === id);
    if (automation && automation.active) {
      try {
        setExecutingAutomation(id);
        setExecutionResult(null);
        
        const success = await executeAutomation(id);
        
        // Afficher le résultat
        setExecutionResult({ id, success });
        
        // Effacer le résultat après 5 secondes
        setTimeout(() => {
          setExecutionResult(null);
        }, 5000);
      } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'automatisation:', error);
      } finally {
        setExecutingAutomation(null);
      }
    }
  };

  const formatTimeLeft = (timeLeft: { days: number; hours: number; minutes: number; seconds: number } | null) => {
    if (!timeLeft) {
      if (nextAutomation) {
        const executionTime = nextAutomation.executionTime || '00:00';
        return `Prochaine automatisation programmée: "${nextAutomation.name}" à ${executionTime}`;
      }
      return 'Aucune automatisation programmée';
    }
    
    const timeDisplay = `${timeLeft.days}j ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    if (nextAutomation) {
      const executionTime = nextAutomation.executionTime || '00:00';
      return `"${nextAutomation.name}" dans ${timeDisplay} (à ${executionTime})`;
    }
    return timeDisplay;
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Statistics */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automatisations</h1>
              <p className="text-gray-600 mt-1">
                Automatisez vos tâches récurrentes et gagnez du temps
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAddAutomation}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>Nouvelle automatisation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="bg-blue-50 border-blue-200 rounded-xl shadow-sm border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <div>
            <p className="font-medium text-blue-800">
              Planificateur d'automatisations actif
            </p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Les automatisations sont exécutées automatiquement selon leur programmation</p>
              {!nextAutomaticExecution && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 font-medium">
                    Aucune automatisation programmée
                  </span>
                </div>
              )}
              {nextAutomaticExecution && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">
                    {formatTimeLeft(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une automatisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="receipt">Quittances</option>
              <option value="rent_review">Révision loyer</option>
              <option value="insurance">Assurance</option>
              <option value="maintenance">Maintenance</option>
              <option value="reminder">Rappels</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Automations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Automatisation</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Fréquence</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Prochaine exécution</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAutomations.map((automation) => (
                <tr key={automation.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(automation.type)}
                      <div>
                        <p className="font-medium text-gray-900">{automation.name}</p>
                        <p className="text-sm text-gray-500">{automation.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-900">{getTypeLabel(automation.type)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-900">{getFrequencyLabel(automation.frequency)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <div className="text-gray-900">{automation.nextExecution.toLocaleDateString()}</div>
                      {automation.lastExecution && (
                        <div className="text-gray-500">
                          Dernière: {automation.lastExecution.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${automation.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-sm ${automation.active ? 'text-green-600' : 'text-gray-500'}`}>
                        {automation.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAutomation(automation.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          automation.active 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={automation.active ? 'Désactiver' : 'Activer'}
                      >
                        {automation.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleExecuteNow(automation.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        disabled={executingAutomation === automation.id || !automation.active}
                        title="Exécuter maintenant"
                      >
                        {executingAutomation === automation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditAutomation(automation)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAutomation(automation.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {executionResult && executionResult.id === automation.id && (
                      <div className={`mt-2 text-xs font-medium ${
                        executionResult.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {executionResult.success 
                          ? 'Exécution réussie ✓' 
                          : 'Échec de l\'exécution ✗'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredAutomations.length === 0 && (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune automatisation trouvée</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Aucune automatisation ne correspond à vos critères.'
              : 'Créez votre première automatisation pour gagner du temps.'
            }
          </p>
          <button 
            onClick={() => setShowAutomationForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer une automatisation
          </button>
        </div>
      )}

      {/* Automation Form Modal - Placeholder */}
      <AutomationForm
        automation={editingAutomation || undefined}
        onSave={handleSaveAutomation}
        onCancel={() => {
          setShowAutomationForm(false);
          setEditingAutomation(null);
        }}
        isOpen={showAutomationForm}
      />
    </div>
  );
};

export default Automations;
