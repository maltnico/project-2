/**
 * Hook d'authentification amélioré avec gestion des cookies et synchronisation des données
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, AuthUser, auth } from '../lib/supabase';
import { cookieManager } from '../lib/cookieManager';
import { dataSyncService } from '../lib/dataSyncService';
import { activityService } from '../lib/activityService';

interface UseEnhancedAuthReturn {
  user: User | null;
  profile: AuthUser | null;
  session: Session | null;
  loading: boolean;
  syncStatus: {
    isLoading: boolean;
    lastSync: number | null;
    error: string | null;
    progress: number;
    currentStep: string;
  };
  signUp: (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    companyName?: string;
    phone?: string;
  }) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearCache: () => void;
  isSessionValid: () => boolean;
  extendSession: () => void;
}

export const useEnhancedAuth = (): UseEnhancedAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<{
    isLoading: boolean;
    lastSync: number | null;
    error: string | null;
    progress: number;
    currentStep: string;
  }>({
    isLoading: false,
    lastSync: null,
    error: null,
    progress: 0,
    currentStep: ''
  });

  /**
   * Gérer les changements d'état de synchronisation
   */
  useEffect(() => {
    const unsubscribe = dataSyncService.addListener((status) => {
      setSyncStatus(status);
    });

    return unsubscribe;
  }, []);

  /**
   * Sauvegarder la session dans les cookies
   */
  const saveSessionToCookie = useCallback((sessionData: Session, rememberMe: boolean = false) => {
    try {
      if (sessionData?.user && sessionData?.access_token) {
        const expirationTime = rememberMe 
          ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 jours si "Se souvenir de moi"
          : Date.now() + (24 * 60 * 60 * 1000); // 24 heures par défaut

        cookieManager.saveSession({
          userId: sessionData.user.id,
          email: sessionData.user.email || '',
          accessToken: sessionData.access_token,
          refreshToken: sessionData.refresh_token || '',
          expiresAt: expirationTime
        });

        // Marquer les données pour rechargement lors de la prochaine connexion
        dataSyncService.scheduleFullRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session:', error);
    }
  }, []);

  /**
   * Restaurer la session depuis les cookies
   */
  const restoreSessionFromCookie = useCallback(async () => {
    try {
      const savedSession = cookieManager.getSession();
      
      if (savedSession && cookieManager.isSessionValid()) {
        // Tentative de restauration de la session Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          setSession(session);
          setUser(session.user);
          return true;
        } else {
          // Session Supabase expirée, nettoyer les cookies
          cookieManager.clearSession();
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la restauration de la session:', error);
      cookieManager.clearSession();
      return false;
    }
  }, []);

  /**
   * Initialisation et écoute des changements d'authentification
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Essayer de restaurer la session depuis les cookies
        const sessionRestored = await restoreSessionFromCookie();
        
        if (!sessionRestored) {
          // Essayer de récupérer la session actuelle depuis Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            // Gérer les erreurs de session invalide
            if (error.message.includes('User from sub claim in JWT does not exist') || 
                error.message.includes('user_not_found') ||
                error.message.includes('Invalid Refresh Token') ||
                error.message.includes('refresh_token_not_found')) {
              await supabase.auth.signOut();
              cookieManager.clearSession();
              setSession(null);
              setUser(null);
              setProfile(null);
            }
          } else if (session) {
            setSession(session);
            setUser(session.user);
            // Sauvegarder la session restaurée
            saveSessionToCookie(session);
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        // En cas d'erreur réseau, garder l'état actuel si possible
        if (error instanceof Error && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('timeout') ||
          error.message.includes('NetworkError')
        )) {
          console.log('Erreur réseau détectée, conservation de l\'état local');
        } else {
          // Pour d'autres erreurs, nettoyer l'état
          setSession(null);
          setUser(null);
          setProfile(null);
          cookieManager.clearSession();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('Auth state change:', event, session?.user?.email);

        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          // Sauvegarder la nouvelle session
          saveSessionToCookie(session);
          
          // Récupérer le profil utilisateur
          await fetchUserProfile(session.user.id);
          
          // Synchroniser les données après la connexion
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await dataSyncService.syncAllData(true);
          }
        } else {
          setProfile(null);
          // Nettoyer les cookies en cas de déconnexion
          if (event === 'SIGNED_OUT') {
            cookieManager.clearSession();
            dataSyncService.clearAllDataAndRefresh();
          }
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [restoreSessionFromCookie, saveSessionToCookie]);

  /**
   * Récupérer le profil utilisateur
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await auth.getProfile(userId);
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // Vérifier si l'utilisateur est admin
      if (data && data.email === 'admin@easybail.pro' && data.role !== 'admin') {
        try {
          await auth.updateProfile(userId, { 
            role: 'admin',
            plan: 'expert',
            subscription_status: 'active'
          });
          data.role = 'admin';
          data.plan = 'expert';
          data.subscription_status = 'active';
        } catch (updateError) {
          console.warn('Could not update admin role:', updateError);
        }
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  /**
   * Inscription avec gestion des cookies
   */
  const signUp = async (
    email: string, 
    password: string, 
    userData: {
      firstName: string;
      lastName: string;
      companyName?: string;
      phone?: string;
    }
  ) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signUp(email, password, userData);
      
      if (error) throw error;
      
      if (data.user && data.session) {
        setUser(data.user as User);
        setSession(data.session as Session);
        saveSessionToCookie(data.session as Session);
        
        // Synchroniser les données après l'inscription
        await dataSyncService.syncAllData(true);
      }
      
    } catch (error: any) {
      let errorMessage = error.message || 'Erreur lors de l\'inscription';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Un compte avec cette adresse email existe déjà';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Format d\'email invalide';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion avec option "Se souvenir de moi"
   */
  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      
      if (error) throw error;
      
      if (data.user && data.session) {
        setUser(data.user as User);
        setSession(data.session as Session);
        saveSessionToCookie(data.session as Session, rememberMe);
        
        // Forcer le rechargement des activités
        localStorage.removeItem('easybail_activities_loaded');
        
        // Synchroniser toutes les données après la connexion
        await dataSyncService.syncAllData(true);
        
        // Mettre à jour les activités
        try {
          await activityService.getActivities();
        } catch (err) {
          console.warn('Error refreshing activities after login:', err);
        }
      }
      
    } catch (error: any) {
      let errorMessage = error.message || 'Erreur lors de la connexion';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes';
      }
      
      // Gérer les erreurs réseau en mode dégradé
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('timeout') ||
        error.message.includes('NetworkError')
      )) {
        console.warn('Network error during sign in. Attempting demo mode.');
        try {
          const demoResult = await auth.signIn(email, password);
          if (demoResult.data?.user && demoResult.data?.session) {
            setUser(demoResult.data.user as User);
            setSession(demoResult.data.session as Session);
            saveSessionToCookie(demoResult.data.session as Session, rememberMe);
            return;
          }
        } catch (demoError) {
          console.error('Failed to use demo mode:', demoError);
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion avec nettoyage complet
   */
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Nettoyer l'état local
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Nettoyer les cookies et le cache
      cookieManager.clearSession();
      dataSyncService.clearAllDataAndRefresh();
      
    } catch (error: any) {
      console.warn('Error signing out:', error);
      
      // Même en cas d'erreur, nettoyer l'état local
      setUser(null);
      setProfile(null);
      setSession(null);
      cookieManager.clearSession();
      dataSyncService.clearAllDataAndRefresh();
      
      // Ne lever l'erreur que si ce n'est pas une erreur réseau
      if (!(error.message?.includes('Failed to fetch') || 
            error.message?.includes('timeout') || 
            error.message?.includes('NetworkError'))) {
        throw new Error('Erreur lors de la déconnexion');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour le profil utilisateur
   */
  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) throw new Error('Utilisateur non connecté');
    
    setLoading(true);
    try {
      const { error } = await auth.updateProfile(user.id, updates);
      
      if (error) throw error;
      
      // Mettre à jour l'utilisateur local
      setUser(prev => prev ? { ...prev, user_metadata: { ...prev.user_metadata, ...updates } } : null);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Réinitialiser le mot de passe
   */
  const resetPassword = async (email: string) => {
    try {
      const { error } = await auth.resetPassword(email);
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  };

  /**
   * Rafraîchir toutes les données
   */
  const refreshData = async () => {
    try {
      await dataSyncService.syncAllData(true);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      throw error;
    }
  };

  /**
   * Nettoyer le cache
   */
  const clearCache = () => {
    dataSyncService.clearAllDataAndRefresh();
  };

  /**
   * Vérifier si la session est valide
   */
  const isSessionValid = () => {
    return cookieManager.isSessionValid();
  };

  /**
   * Étendre la session
   */
  const extendSession = () => {
    if (session) {
      saveSessionToCookie(session, true);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    syncStatus,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    refreshData,
    clearCache,
    isSessionValid,
    extendSession
  };
};
