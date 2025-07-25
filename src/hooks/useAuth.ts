import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, AuthUser, auth } from '../lib/supabase';
import { activityService } from '../lib/activityService';

interface UseAuthReturn {
  user: User | null;
  profile: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    companyName?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  showLoginPage: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Si il y a une erreur liée à un utilisateur inexistant ou un refresh token invalide, nettoyer la session
        if (!session) {
          setSession(null);
          setUser(null);
          return;
        }
        
        setSession(session);
        setUser(session?.user || null);
        
        // Fetch user profile if user is logged in
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
      } catch (error: unknown) {
        console.warn('Error getting initial session:', error);
        const authError = error as { message?: string; name?: string };
        
        // Ne pas déconnecter l'utilisateur en cas d'erreur réseau
        if (authError.message === 'Network connection failed. Switching to offline mode.' ||
            authError.message === 'Failed to fetch' ||
            authError.message?.includes('fetch') ||
            authError.name === 'TimeoutError' ||
            authError.name === 'AbortError') {
          // Garder l'état d'authentification actuel en mode hors ligne
          console.warn('Network error - keeping current auth state');
        } else {
          // En cas d'erreur inattendue (non réseau), nettoyer la session
          try {
            await supabase.auth.signOut();
          } catch {
            console.error('Error signing out after session error');
          }
          setSession(null);
          setUser(null);
        }
      }
    };

    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        // Fetch user profile when auth state changes
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await auth.getProfile(userId);
      
      if (!data) {
        console.error('No user profile data returned');
        return;
      }
      
      // Vérifier si l'utilisateur est admin et mettre à jour le rôle
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
        } catch {
          console.warn('Could not update admin role');
        }
      }
      
      setProfile(data);
    } catch (error: unknown) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    userData: {
      firstName: string;
      lastName: string;
      companyName?: string;
      phone?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data } = await auth.signUp(email, password, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        companyName: userData.companyName,
        phone: userData.phone
      });
      
      setUser(data.user as User);
      setProfile(null); // Will be fetched on auth state change
      setSession(data.session as Session);
      
      return { success: true };
    } catch (error: unknown) {
      // Handle specific Supabase errors with user-friendly messages
      const authError = error as { message?: string };
      let errorMessage = authError.message || 'Erreur lors de l\'inscription';
      
      if (authError.message?.includes('User already registered')) {
        errorMessage = 'Un compte avec cette adresse email existe déjà';
      } else if (authError.message?.includes('Database error saving new user')) {
        errorMessage = 'Erreur de configuration de la base de données. Veuillez contacter le support.';
      } else if (authError.message?.includes('Password should be at least')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (authError.message?.includes('Invalid email')) {
        errorMessage = 'Format d\'email invalide';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data } = await auth.signIn(email, password);
      
      setUser(data.user as User);
      setProfile(null); // Will be fetched on auth state change
      setSession(data.session as Session);
      
      // Refresh activities on successful sign in
      try {
        localStorage.removeItem('easybail_activities_loaded');
        activityService.getActivities().catch(err => console.warn('Error refreshing activities after login:', err));
      } catch (err) {
        console.warn('Error refreshing activities after login:', err);
      }
      
      return { success: true };
    } catch (error: unknown) {
      const authError = error as { message?: string };
      let errorMessage = authError.message || 'Erreur lors de la connexion';
      
      if (authError.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (authError.message?.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
      } else if (authError.message?.includes('Too many requests')) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes';
      }
      
      if (authError.message?.includes('Failed to fetch') ||
          authError.message?.includes('timeout') ||
          authError.message?.includes('NetworkError')) {
        console.warn('Network error during sign in. Attempting to use demo mode.');
        // Try to use demo mode instead of failing completely
        try {
          const demoResult = await auth.signIn(email, password);
          if (demoResult.data?.user) {
            setUser(demoResult.data.user as User);
            setSession(demoResult.data.session as Session);
            return { success: true };
          }
        } catch {
          console.error('Failed to use demo mode');
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error: unknown) {
      const authError = error as { message?: string };
      console.warn('Error signing out:', error);
      // Even if there's an error, we should still clear the local state
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Only throw if it's not a network error
      if (!(authError.message?.includes('Failed to fetch') || 
            authError.message?.includes('timeout') || 
            authError.message?.includes('NetworkError'))) {
        throw new Error('Erreur lors de la déconnexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) throw new Error('Utilisateur non connecté');
    
    setLoading(true);
    try {
      await auth.updateProfile(user.id, updates);
      
      // Mettre à jour l'utilisateur local
      setUser(prev => prev ? { ...prev, user_metadata: { ...prev.user_metadata, ...updates } } : null);
    } catch (error: unknown) {
      const authError = error as { message?: string };
      throw new Error(authError.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email);
    } catch (error: unknown) {
      const authError = error as { message?: string };
      throw new Error(authError.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const showLoginPage = () => {
    // Cette fonction peut être utilisée pour forcer l'affichage de la page de login
    // Pour l'instant, on ne fait rien car la logique est gérée dans App.tsx
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    showLoginPage,
  };
};
