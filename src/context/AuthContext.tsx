import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isManager: false,
  isSuperAdmin: false,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const ADMIN_EMAILS = [
  'contact.acomtechnologie@gmail.com',
  'contact.abdoulayendiaye@gmail.com'
];

const MANAGER_EMAILS = [
  'gestionnaire.acomtechnologie@gmail.com'
];

const SUPER_ADMIN_EMAILS = [
  'contact.abdoulayendiaye@gmail.com',
  'contact.acomtechnologie@gmail.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error getting session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (currentUser: User) => {
    try {
      const timeoutPromise = new Promise<{data: any, error: any}>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching profile')), 10000)
      );
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const isAdminEmail = currentUser.email && ADMIN_EMAILS.includes(currentUser.email);
        const isManagerEmail = currentUser.email && MANAGER_EMAILS.includes(currentUser.email);
        const expectedRole = isAdminEmail ? 'admin' : (isManagerEmail ? 'manager' : 'client');
        
        if (data.role !== expectedRole) {
          const updatePromise = supabase
            .from('users')
            .update({ role: expectedRole })
            .eq('id', currentUser.id);
          await Promise.race([updatePromise, timeoutPromise]);
        }

        setProfile({
          uid: data.id,
          email: data.email,
          displayName: data.display_name,
          photoURL: data.photo_url,
          role: expectedRole,
          createdAt: new Date(data.created_at)
        });
      } else {
        // Create profile if it doesn't exist
        const isAdminEmail = currentUser.email && ADMIN_EMAILS.includes(currentUser.email);
        const isManagerEmail = currentUser.email && MANAGER_EMAILS.includes(currentUser.email);
        
        const newProfile: UserProfile = {
          uid: currentUser.id,
          email: currentUser.email || '',
          displayName: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Utilisateur',
          photoURL: currentUser.user_metadata?.avatar_url || '',
          role: isAdminEmail ? 'admin' : (isManagerEmail ? 'manager' : 'client'),
          createdAt: new Date()
        };

        const insertPromise = supabase.from('users').insert({
          id: newProfile.uid,
          email: newProfile.email,
          display_name: newProfile.displayName,
          photo_url: newProfile.photoURL,
          role: newProfile.role,
          created_at: newProfile.createdAt
        });
        await Promise.race([insertPromise, timeoutPromise]);
        
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const timeoutPromise = new Promise<{error: any}>((_, reject) => 
      setTimeout(() => reject(new Error('Le serveur met trop de temps à répondre. Veuillez réessayer.')), 15000)
    );
    const signInPromise = supabase.auth.signInWithPassword({ email, password });
    
    const { error } = await Promise.race([signInPromise, timeoutPromise]);
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const timeoutPromise = new Promise<{data: any, error: any}>((_, reject) => 
      setTimeout(() => reject(new Error('Le serveur met trop de temps à répondre. Veuillez réessayer.')), 15000)
    );
    const signUpPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    const { data: { user: newUser }, error } = await Promise.race([signUpPromise, timeoutPromise]);
    
    if (error) throw error;
    if (!newUser) return;

    const isAdminEmail = email && ADMIN_EMAILS.includes(email);
    const isManagerEmail = email && MANAGER_EMAILS.includes(email);

    const newProfile: UserProfile = {
      uid: newUser.id,
      email: email,
      displayName: fullName,
      photoURL: '',
      role: isAdminEmail ? 'admin' : (isManagerEmail ? 'manager' : 'client'),
      createdAt: new Date()
    };

    await supabase.from('users').insert({
      id: newProfile.uid,
      email: newProfile.email,
      display_name: newProfile.displayName,
      photo_url: newProfile.photoURL,
      role: newProfile.role,
      created_at: newProfile.createdAt
    });

    setProfile(newProfile);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);
  const isManager = !!user?.email && MANAGER_EMAILS.includes(user.email);
  const isSuperAdmin = !!user?.email && SUPER_ADMIN_EMAILS.includes(user.email);

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isManager,
    isSuperAdmin,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

