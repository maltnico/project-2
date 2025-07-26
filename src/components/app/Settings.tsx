import { useState } from 'react';
import { useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Database, 
  Mail, 
  Save,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Lock,
  FileText,
  HelpCircle,
  X,
  Send
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { sendContactEmailDirect } from '../../lib/contactService';

// Contact Modal Component - Moved outside to prevent recreation on each render
const ContactModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  contactForm, 
  setContactForm, 
  contactFormErrors, 
  setContactFormErrors, 
  isSubmitting, 
  profileData 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  contactForm: { subject: string; message: string; priority: 'low' | 'normal' | 'high' };
  setContactForm: React.Dispatch<React.SetStateAction<{ subject: string; message: string; priority: 'low' | 'normal' | 'high' }>>;
  contactFormErrors: { subject?: string; message?: string };
  setContactFormErrors: React.Dispatch<React.SetStateAction<{ subject?: string; message?: string }>>;
  isSubmitting: boolean;
  profileData: { firstName: string; lastName: string; email: string; phone: string; companyName: string; avatar: string };
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Contacter le support</h3>
              <p className="text-sm text-gray-600">Nous vous répondons sous 2h</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
          <form onSubmit={onSubmit} className="p-6">
            <div className="space-y-6">
              {/* Priority Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau de priorité
                </label>
                <select
                  value={contactForm.priority}
                  onChange={(e) => setContactForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={isSubmitting}
                >
                  <option value="low">⚪ Faible</option>
                  <option value="normal">🔵 Normale</option>
                  <option value="high">🔴 Élevée</option>
                </select>
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet du message *
                </label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => {
                    const value = e.target.value;
                    setContactForm(prev => ({ ...prev, subject: value }));
                    if (contactFormErrors.subject) {
                      setContactFormErrors(prev => ({ ...prev, subject: undefined }));
                    }
                  }}
                  placeholder="Ex: Problème de connexion, Question sur la facturation..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    contactFormErrors.subject 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {contactFormErrors.subject && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{contactFormErrors.subject}</span>
                  </p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre message *
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => {
                    const value = e.target.value;
                    setContactForm(prev => ({ ...prev, message: value }));
                    if (contactFormErrors.message) {
                      setContactFormErrors(prev => ({ ...prev, message: undefined }));
                    }
                  }}
                  placeholder="Décrivez votre demande en détail. Plus vous serez précis, plus nous pourrons vous aider efficacement."
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none ${
                    contactFormErrors.message 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {contactFormErrors.message && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{contactFormErrors.message}</span>
                  </p>
                )}
              </div>

              {/* User Info Display */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Informations de contact</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span> {profileData.email || 'Non renseigné'}
                  </p>
                  {profileData.phone && (
                    <p className="text-gray-700">
                      <span className="font-medium">Téléphone:</span> {profileData.phone}
                    </p>
                  )}
                  {profileData.companyName && (
                    <p className="text-gray-700">
                      <span className="font-medium">Société:</span> {profileData.companyName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                * Champs obligatoires
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !contactForm.subject.trim() || !contactForm.message.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[120px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Envoyer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user, profile, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    avatar: ''
  });

  // Contact modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high'
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactFormErrors, setContactFormErrors] = useState<{
    subject?: string;
    message?: string;
  }>({});

  // Initialize profile data when profile is loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        companyName: profile.company_name || '',
        avatar: profile.avatar_url || ''
      });
    }
  }, [profile]);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    rentReminders: true,
    maintenanceAlerts: true,
    documentSigning: true,
    marketingEmails: false,
    weeklyReports: true
  });

  // Security settings
  const [securitySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    passwordLastChanged: new Date('2024-01-15'),
    loginHistory: [
      { date: new Date(), location: 'Paris, France', device: 'Chrome sur Windows' },
      { date: new Date('2024-11-28'), location: 'Paris, France', device: 'Safari sur iPhone' }
    ]
  });

  // App settings
  const [appSettings, setAppSettings] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR',
    autoSave: true,
    compactView: false
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    { id: 'app', label: 'Application', icon: SettingsIcon },
    { id: 'data', label: 'Données', icon: Database },
    { id: 'support', label: 'Support', icon: HelpCircle }
  ];

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // Update profile in Supabase
      await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
        company_name: profileData.companyName
      });
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      });
    } finally {
      setLoading(false);
    }
  };

  // Contact modal functions
  const validateContactForm = () => {
    const errors: { subject?: string; message?: string } = {};
    
    if (!contactForm.subject.trim()) {
      errors.subject = 'Le sujet est obligatoire';
    } else if (contactForm.subject.trim().length < 5) {
      errors.subject = 'Le sujet doit contenir au moins 5 caractères';
    }
    
    if (!contactForm.message.trim()) {
      errors.message = 'Le message est obligatoire';
    } else if (contactForm.message.trim().length < 10) {
      errors.message = 'Le message doit contenir au moins 10 caractères';
    }
    
    return errors;
  };

  const resetContactForm = () => {
    setContactForm({
      subject: '',
      message: '',
      priority: 'normal'
    });
    setContactFormErrors({});
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateContactForm();
    if (Object.keys(errors).length > 0) {
      setContactFormErrors(errors);
      return;
    }
    
    setIsSubmittingContact(true);
    setContactFormErrors({});
    
    try {
      // Prepare email data
      const emailData = {
        to: 'admin@easybail.pro',
        subject: `[${contactForm.priority.toUpperCase()}] Support - ${contactForm.subject}`,
        message: `
Nouveau message de support reçu:

**Priorité:** ${contactForm.priority === 'high' ? '🔴 Élevée' : contactForm.priority === 'normal' ? '🔵 Normale' : '⚪ Faible'}

**Sujet:** ${contactForm.subject}

**Message:**
${contactForm.message}

**Informations utilisateur:**
- Email: ${profileData.email}
- Nom: ${profileData.firstName} ${profileData.lastName}
- Téléphone: ${profileData.phone || 'Non renseigné'}
- Société: ${profileData.companyName || 'Non renseigné'}
- ID utilisateur: ${user?.id}

---
Message envoyé le ${new Date().toLocaleString('fr-FR')}
        `,
        priority: contactForm.priority,
        userInfo: {
          email: profileData.email,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          companyName: profileData.companyName,
          userId: user?.id
        }
      };

      // Send email using the contact service
      await sendContactEmailDirect(emailData);
      
      setMessage({ 
        type: 'success', 
        text: 'Votre message a été envoyé avec succès. Notre équipe vous répondra sous 2h.' 
      });
      
      resetContactForm();
      setIsContactModalOpen(false);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Erreur lors de l\'envoi du message. Veuillez réessayer.' 
      });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleCloseContactModal = () => {
    if (!isSubmittingContact) {
      setIsContactModalOpen(false);
      resetContactForm();
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
        
        {/* Avatar */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            {profileData.avatar ? (
              <img src={profileData.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-blue-600" />
            )}
          </div>
          <div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Changer la photo
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG ou GIF. Max 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Société</label>
            <input
              type="text"
              value={profileData.companyName}
              onChange={(e) => setProfileData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleProfileUpdate}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Sauvegarder</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences de notification</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications par email</p>
                <p className="text-sm text-gray-500">Recevez les notifications importantes par email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications SMS</p>
                <p className="text-sm text-gray-500">Recevez les alertes urgentes par SMS</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications push</p>
                <p className="text-sm text-gray-500">Notifications dans le navigateur</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <h4 className="text-md font-semibold text-gray-900 mt-6 mb-4">Types de notifications</h4>
        
        <div className="space-y-3">
          {[
            { key: 'rentReminders', label: 'Rappels de loyer', desc: 'Notifications pour les loyers en retard' },
            { key: 'maintenanceAlerts', label: 'Alertes maintenance', desc: 'Incidents et demandes de maintenance' },
            { key: 'documentSigning', label: 'Signature de documents', desc: 'Documents en attente de signature' },
            { key: 'weeklyReports', label: 'Rapports hebdomadaires', desc: 'Résumé de votre activité' },
            { key: 'marketingEmails', label: 'Emails marketing', desc: 'Nouveautés et conseils' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sécurité du compte</h3>
        
        {/* Password */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Mot de passe</p>
                <p className="text-sm text-gray-500">
                  Dernière modification: {securitySettings.passwordLastChanged.toLocaleDateString()}
                </p>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Changer
            </button>
          </div>
        </div>

        {/* Login History */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Historique des connexions</h4>
          <div className="space-y-3">
            {securitySettings.loginHistory.map((login, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{login.device}</p>
                  <p className="text-sm text-gray-500">{login.location}</p>
                </div>
                <span className="text-sm text-gray-600">{login.date.toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturation et abonnement</h3>
        
        {/* Current Plan */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-blue-900">Plan {profile?.plan || 'Starter'}</h4>
              <p className="text-blue-700">
                {profile?.subscription_status === 'trial' ? 'Période d\'essai' : 'Abonnement actif'}
              </p>
              {profile?.trial_ends_at && (
                <p className="text-sm text-blue-600 mt-1">
                  Expire le: {new Date(profile.trial_ends_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Changer de plan
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Méthode de paiement</p>
                <p className="text-sm text-gray-500">Aucune carte enregistrée</p>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Ajouter
            </button>
          </div>
        </div>

        {/* Billing History */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Historique de facturation</h4>
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune facture disponible</p>
            <p className="text-sm text-gray-500 mt-2">
              Vos factures apparaîtront ici une fois votre abonnement activé
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences de l'application</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
            <select
              value={appSettings.language}
              onChange={(e) => setAppSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fuseau horaire</label>
            <select
              value={appSettings.timezone}
              onChange={(e) => setAppSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format de date</label>
            <select
              value={appSettings.dateFormat}
              onChange={(e) => setAppSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
            <select
              value={appSettings.currency}
              onChange={(e) => setAppSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar américain ($)</option>
              <option value="GBP">Livre (£)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {theme === 'light' ? (
                <Sun className="h-5 w-5 text-gray-600" />
              ) : theme === 'dark' ? (
                <Moon className="h-5 w-5 text-gray-600" />
              ) : (
                <Globe className="h-5 w-5 text-gray-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">Apparence de l'interface</p>
                <p className="text-sm text-gray-500">Apparence de l'interface</p>
              </div>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Clair</option>
              <option value="dark">Foncé</option>
              <option value="auto">Automatique</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Save className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Sauvegarde automatique</p>
                <p className="text-sm text-gray-500">Sauvegarde automatique des modifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appSettings.autoSave}
                onChange={(e) => setAppSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Vue compacte</p>
                <p className="text-sm text-gray-500">Affichage plus dense des listes</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appSettings.compactView}
                onChange={(e) => setAppSettings(prev => ({ ...prev, compactView: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion des données</h3>
        
        {/* Export Data */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Download className="h-6 w-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-blue-900">Exporter mes données</h4>
          </div>
          <p className="text-blue-700 mb-4">
            Téléchargez une copie de toutes vos données au format JSON ou CSV.
          </p>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Exporter en JSON
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Exporter en CSV
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
            <h4 className="text-lg font-semibold text-red-900">Supprimer mon compte</h4>
          </div>
          <p className="text-red-700 mb-4">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
          </p>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );

  const renderSupportTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Support et aide</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              <h4 className="text-lg font-semibold text-blue-900">Centre d'aide</h4>
            </div>
            <p className="text-blue-700 mb-4">
              Consultez notre base de connaissances et nos guides.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Accéder au centre d'aide
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="h-6 w-6 text-green-600" />
              <h4 className="text-lg font-semibold text-green-900">Contacter le support</h4>
            </div>
            <p className="text-green-700 mb-4">
              Notre équipe vous répond sous 2h en moyenne.
            </p>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Envoyer un message
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations système</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span className="text-gray-900">1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Navigateur:</span>
              <span className="text-gray-900">{navigator.userAgent.split(' ')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dernière connexion:</span>
              <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID utilisateur:</span>
              <span className="text-gray-900 font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'billing':
        return renderBillingTab();
      case 'app':
        return renderAppTab();
      case 'data':
        return renderDataTab();
      case 'support':
        return renderSupportTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos préférences et paramètres de compte
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Compte actif</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal 
        isOpen={isContactModalOpen}
        onClose={handleCloseContactModal}
        onSubmit={handleContactFormSubmit}
        contactForm={contactForm}
        setContactForm={setContactForm}
        contactFormErrors={contactFormErrors}
        setContactFormErrors={setContactFormErrors}
        isSubmitting={isSubmittingContact}
        profileData={profileData}
      />
    </div>
  );
};

export default Settings;
