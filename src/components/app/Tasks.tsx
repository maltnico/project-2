import { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Tag,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Building,
  Users,
  X,
  Save
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { Task } from '../../types';

const Tasks = () => {
  const { tasks, loading, addTask, updateTask, deleteTask, completeTask } = useTasks();
  
  // Form states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'other' as 'maintenance' | 'administrative' | 'financial' | 'visit' | 'other',
    propertyId: '',
    propertyName: '',
    tenantId: '',
    tenantName: '',
    assignedTo: ''
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Filter tasks based on search term and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.propertyName && task.propertyName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesCategory = !filterCategory || task.category === filterCategory;
    
    return matchesSearch && matchesPriority && matchesStatus && matchesCategory;
  });

  // Statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length
  };

  // Event handlers
  const handleCreateTask = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      category: 'other',
      propertyId: '',
      propertyName: '',
      tenantId: '',
      tenantName: '',
      assignedTo: ''
    });
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate.toISOString().split('T')[0],
      priority: task.priority,
      category: task.category,
      propertyId: task.propertyId || '',
      propertyName: task.propertyName || '',
      tenantId: task.tenantId || '',
      tenantName: task.tenantName || '',
      assignedTo: task.assignedTo || ''
    });
    setShowTaskForm(true);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      deleteTask(id);
    }
  };

  const handleCompleteTask = (id: string) => {
    completeTask(id);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      dueDate: new Date(formData.dueDate),
      priority: formData.priority,
      category: formData.category,
      propertyId: formData.propertyId || undefined,
      propertyName: formData.propertyName || undefined,
      tenantId: formData.tenantId || undefined,
      tenantName: formData.tenantName || undefined,
      assignedTo: formData.assignedTo || undefined,
      status: 'pending' as const
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }

    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header with Statistics */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <CheckSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tâches</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos tâches et suivez leur progression
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateTask}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle tâche
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total des tâches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckSquare className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Toutes les priorités</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            <option value="maintenance">Maintenance</option>
            <option value="administrative">Administratif</option>
            <option value="financial">Financier</option>
            <option value="visit">Visite</option>
            <option value="other">Autre</option>
          </select>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {filteredTasks.length} résultat(s)
            </span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune tâche</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer une nouvelle tâche.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateTask}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouvelle tâche
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {task.category === 'maintenance' && <Building className="h-5 w-5 text-blue-600" />}
                      {task.category === 'administrative' && <Users className="h-5 w-5 text-purple-600" />}
                      {task.category === 'financial' && <Tag className="h-5 w-5 text-green-600" />}
                      {task.category === 'visit' && <Calendar className="h-5 w-5 text-orange-600" />}
                      {task.category === 'other' && <CheckSquare className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.status === 'pending' ? 'En attente' : task.status === 'completed' ? 'Terminée' : 'Annulée'}
                        </span>
                        <span className="text-sm text-gray-500">
                          Échéance: {task.dueDate.toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {(task.propertyName || task.tenantName) && (
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          {task.propertyName && (
                            <div className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{task.propertyName}</span>
                            </div>
                          )}
                          {task.tenantName && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{task.tenantName}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="text-green-600 hover:text-green-900 transition-colors p-2 rounded-full hover:bg-green-50"
                        title="Marquer comme terminée"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-2 rounded-full hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-full hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <CheckSquare className="h-5 w-5" />
                  <span>{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</span>
                </h3>
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="text-white hover:text-green-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="administrative">Administratif</option>
                  <option value="financial">Financier</option>
                  <option value="visit">Visite</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du bien
                  </label>
                  <input
                    type="text"
                    name="propertyName"
                    value={formData.propertyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du locataire
                  </label>
                  <input
                    type="text"
                    name="tenantName"
                    value={formData.tenantName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>{editingTask ? 'Mettre à jour' : 'Créer la tâche'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
