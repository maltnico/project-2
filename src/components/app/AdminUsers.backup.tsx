import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Save,
  Eye,
  EyeOff,
  Lock,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { activityService } from '../../lib/activityService';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  phone: string | null;
  plan: 'starter' | 'professional' | 'expert';
  trial_ends_at: string;
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  role?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    plan: 'starter' as 'starter' | 'professional' | 'expert',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Chargement des utilisateurs...');

      // Méthode 1: Essayer de récupérer depuis la table profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          company_name,
          phone,
          plan,
          trial_ends_at,
          subscription_status,
          avatar_url,
          created_at,
          updated_at,
          role
        `)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.warn('Erreur avec profiles:', profilesError);
        
        // Méthode 2: Essayer avec auth.admin si profiles échoue
        try {
          const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
          
          if (authError) throw authError;
          
          console.log('✅ Utilisateurs récupérés via auth.admin:', authData.users.length);
          
          // Convertir les utilisateurs auth en format profiles
          const convertedUsers = authData.users.map(user => ({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || '',
            last_name: user.user_metadata?.last_name || '',
            company_name: user.user_metadata?.company_name || null,
            phone: user.user_metadata?.phone || null,
            plan: (user.user_metadata?.plan as 'starter' | 'professional' | 'expert') || 'starter',
            trial_ends_at: user.user_metadata?.trial_ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            subscription_status: (user.user_metadata?.subscription_status as 'trial' | 'active' | 'cancelled' | 'expired') || 'trial',
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            role: user.user_metadata?.role || 'user'
          }));
          
          setUsers(convertedUsers);
          return;
        } catch (authErr) {
          console.error('Erreur avec auth.admin:', authErr);
          throw profilesError; // Retourner l'erreur originale
        }
      }
      
      console.log('✅ Utilisateurs récupérés via profiles:', profilesData?.length || 0);
      setUsers(profilesData || []);
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    if (!formData.first_name) {
      errors.first_name = 'Le prénom est requis';
    }
    
    if (!formData.last_name) {
      errors.last_name = 'Le nom est requis';
    }
    
    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 6) {
        errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setFormSuccess(null);
      
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            company_name: formData.company_name || null,
            phone: formData.phone || null,
            plan: formData.plan
          })
          .eq('id', editingUser.id);
        
        if (error) throw error;
        
        // Log activity
        activityService.addActivity({
          type: 'system',
          action: 'user_updated',
          title: 'Utilisateur mis à jour',
          description: `L'utilisateur ${formData.first_name} ${formData.last_name} a été mis à jour`,
          userId: 'current-user',
          priority: 'medium',
          category: 'info'
        });
        
        setFormSuccess('Utilisateur mis à jour avec succès');
      } else {
        // Create new user via auth.signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        });
        
        if (authError) throw authError;
        
        // Create profile manually since we're in admin mode
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              company_name: formData.company_name || null,
              phone: formData.phone || null,
              plan: formData.plan
            });
          
          if (profileError) throw profileError;
        }
        
        // Log activity
        activityService.addActivity({
          type: 'system',
          action: 'user_created',
          title: 'Nouvel utilisateur créé',
          description: `L'utilisateur ${formData.first_name} ${formData.last_name} a été créé`,
          userId: 'current-user',
          priority: 'medium',
          category: 'success'
        });
        
        setFormSuccess('Utilisateur créé avec succès');
      }
      
      // Reload users
      await loadUsers();
      
      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        company_name: '',
        phone: '',
        plan: 'starter',
        password: '',
        confirmPassword: ''
      });
      
      setShowUserForm(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Error creating/updating user:', err);
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      company_name: user.company_name || '',
      phone: user.phone || '',
      plan: user.plan,
      password: '',
      confirmPassword: ''
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    // Empêcher la suppression de l'admin principal
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.email === 'admin@easybail.pro') {
      alert('Impossible de supprimer l\'administrateur principal');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      setLoading(true);
      
      // Delete user from profiles table (admin action)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log activity
      activityService.addActivity({
        type: 'system',
        action: 'user_deleted',
        title: 'Utilisateur supprimé',
        description: `Un utilisateur a été supprimé du système`,
        userId: 'current-user',
        priority: 'high',
        category: 'warning'
      });
      
      // Reload users
      await loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      setLoading(true);
      
      // Empêcher de modifier le rôle de l'admin principal
      const userToUpdate = users.find(u => u.id === userId);
      if (userToUpdate?.email === 'admin@easybail.pro' && role !== 'admin') {
        alert('Impossible de modifier le rôle de l\'administrateur principal');
        return;
      }
      
      // Update role in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
      
      // Log activity
      activityService.addActivity({
        type: 'system',
        action: 'role_changed',
        title: 'Rôle utilisateur modifié',
        description: `Le rôle d'un utilisateur a été changé en ${role}`,
        userId: 'current-user',
        priority: 'medium',
        category: 'warning'
      });
      
    } catch (err) {
      console.error('Error changing user role:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || user.subscription_status === filterStatus;
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'trial':
        return 'Essai';
      case 'active':
        return 'Actif';
      case 'cancelled':
        return 'Annulé';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'starter':
        return 'Starter';
      case 'professional':
        return 'Professionnel';
      case 'expert':
        return 'Expert';
      default:
        return plan;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'manager':
        return 'Gestionnaire';
      case 'user':
        return 'Utilisateur';
      default:
        return role || 'Utilisateur';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Statistics */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
              <p className="text-gray-600 mt-1">
                Administrez tous les utilisateurs de la plateforme
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  email: '',
                  first_name: '',
                  last_name: '',
                  company_name: '',
                  phone: '',
                  plan: 'starter',
                  password: '',
                  confirmPassword: ''
                });
                setShowUserForm(true);
              }}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Nouvel utilisateur
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.subscription_status === 'active').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En essai</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.subscription_status === 'trial').length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {formSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{formSuccess}</p>
        </div>
      )}

      {/* Section de debug pour maltese.jean@free.fr */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h4 className="font-medium text-yellow-900 mb-3">🔍 Recherche de maltese.jean@free.fr</h4>
        <div className="text-sm space-y-2">
          {(() => {
            const malteseUser = users.find(u => u.email === 'maltese.jean@free.fr');
            const filteredUsers = users.filter(user => {
              const matchesSearch = 
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
              
              const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
              const matchesStatus = filterStatus === 'all' || user.subscription_status === filterStatus;
              
              return matchesSearch && matchesPlan && matchesStatus;
            });
            const malteseInFiltered = filteredUsers.find(u => u.email === 'maltese.jean@free.fr');
            
            return (
              <div className="space-y-1">
                <p>• <strong>Total utilisateurs chargés:</strong> {users.length}</p>
                <p>• <strong>Utilisateurs après filtrage:</strong> {filteredUsers.length}</p>
                <p>• <strong>maltese.jean@free.fr trouvé dans les données:</strong> {malteseUser ? '✅ OUI' : '❌ NON'}</p>
                {malteseUser && (
                  <div className="ml-4 text-xs">
                    <p>- Nom: {malteseUser.first_name} {malteseUser.last_name}</p>
                    <p>- Plan: {malteseUser.plan}</p>
                    <p>- Statut: {malteseUser.subscription_status}</p>
                    <p>- Rôle: {malteseUser.role || 'user'}</p>
                  </div>
                )}
                <p>• <strong>maltese.jean@free.fr visible après filtrage:</strong> {malteseInFiltered ? '✅ OUI' : '❌ NON'}</p>
                {malteseUser && !malteseInFiltered && (
                  <p className="text-red-600">⚠️ L'utilisateur est masqué par les filtres actuels</p>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou entreprise..."
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
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="all">Tous les plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professionnel</option>
              <option value="expert">Expert</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="trial">Essai</option>
              <option value="active">Actif</option>
              <option value="cancelled">Annulé</option>
              <option value="expired">Expiré</option>
            </select>
            <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 flex items-center justify-between">
          {(() => {
            const filteredUsers = users.filter(user => {
              const matchesSearch = 
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
              
              const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
              const matchesStatus = filterStatus === 'all' || user.subscription_status === filterStatus;
              
              return matchesSearch && matchesPlan && matchesStatus;
            });
            
            return (
              <>
                <p className="text-sm text-gray-600">
                  {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} 
                  {searchTerm && ` trouvé${filteredUsers.length > 1 ? 's' : ''} pour "${searchTerm}"`}
                </p>
                {filteredUsers.length > 0 && (
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {users.filter(u => u.subscription_status === 'active').length} actif{users.filter(u => u.subscription_status === 'active').length > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      {users.filter(u => u.subscription_status === 'trial').length} en essai
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Utilisateur</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Email</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Rôle</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Plan</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Créé le</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Dernière connexion</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.company_name && (
                          <p className="text-sm text-gray-500">{user.company_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{user.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="manager">Gestionnaire</option>
                        <option value="admin">Administrateur</option>
                      </select>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role || 'user')}`}>
                        {getRoleLabel(user.role || 'user')}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-900">{getPlanLabel(user.plan)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.subscription_status)}`}>
                      {getStatusLabel(user.subscription_status)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-900">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString() 
                        : 'Jamais'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterPlan !== 'all' || filterStatus !== 'all'
              ? 'Aucun utilisateur ne correspond à vos critères de recherche.'
              : 'Aucun utilisateur n\'a encore créé de compte.'
            }
          </p>
          <button 
            onClick={() => {
              setEditingUser(null);
              setFormData({
                email: '',
                first_name: '',
                last_name: '',
                company_name: '',
                phone: '',
                plan: 'starter',
                password: '',
                confirmPassword: ''
              });
              setShowUserForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter un utilisateur
          </button>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button
                onClick={() => setShowUserForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-6">
              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 font-medium">{formErrors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Jean"
                  />
                  {formErrors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Dupont"
                  />
                  {formErrors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!!editingUser}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${editingUser ? 'bg-gray-100' : ''}`}
                  placeholder="jean.dupont@example.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
                {editingUser && (
                  <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Société (optionnel)
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ma société"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan
                </label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professionnel</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe *
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  <span>{editingUser ? 'Mettre à jour' : 'Créer l\'utilisateur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
