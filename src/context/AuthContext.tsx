import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { db as localDb } from '../db/db';
import { liveQuery } from 'dexie';

// Lazy load sync services to prevent circular dependencies
const getSyncService = () => import('../services/syncService').then(m => m.syncService);
const getSyncManager = () => import('../services/backgroundSyncManager').then(m => m.syncManager);

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isPartner: boolean;
  isSuperAdmin: boolean;
  syncCustomClaims: () => Promise<void>;
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
  isPartner: false,
  isSuperAdmin: false,
  syncCustomClaims: async () => {},
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
  const [customClaims, setCustomClaims] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result on mount to catch errors from Google login flow
    if (typeof window !== 'undefined') {
      console.log('AuthContext: Checking getRedirectResult');
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('AuthContext: getRedirectResult success:', result.user.email);
          } else {
            console.log('AuthContext: getRedirectResult no result');
          }
        })
        .catch((error) => {
          console.error('AuthContext: Error from getRedirectResult:', error);
        });
    }

    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('AuthContext: onAuthStateChanged - currentUser:', currentUser);
      
      // Cleanup previous profile listener
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      setUser(currentUser);
      if (currentUser) {
        // Fetch custom claims
        const tokenResult = await currentUser.getIdTokenResult();
        setCustomClaims(tokenResult.claims);
        
        // Setup local watcher for profile using Dexie
        const observable = liveQuery(() => localDb.users.get(currentUser.uid));
        const sub = observable.subscribe({
          next: (data) => {
            if (data) {
              const isAdminEmail = currentUser.email && ADMIN_EMAILS.includes(currentUser.email);
              const isManagerEmail = currentUser.email && MANAGER_EMAILS.includes(currentUser.email);
              const expectedRole = isAdminEmail ? 'admin' : (isManagerEmail ? 'manager' : 'client');
              
              setProfile({
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: data.display_name || data.displayName || currentUser.displayName || 'Utilisateur',
                photoURL: data.photo_url || data.photoURL || currentUser.photoURL || '',
                role: data.role || expectedRole,
                partnerStatus: data.partnerStatus,
                partnerDetails: data.partnerDetails,
                merchantId: data.merchant_id || data.merchantId,
                createdAt: data.created_at?.toDate ? data.created_at.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.created_at || data.createdAt || Date.now()))
              });
              setLoading(false);
            } else {
              // If not in Dexie, try to fetch then create if missing
              getSyncService().then(service => service.syncUserProfile(currentUser.uid)).then(() => {
                // After sync attempt, checking one last time
                localDb.users.get(currentUser.uid).then(profile => {
                  if (!profile) {
                    createProfileIfMissing(currentUser);
                  }
                });
              }).catch(err => {
                console.error('Initial profile sync failed:', err);
                setLoading(false);
              });
            }
          },
          error: (err) => {
            console.error('Dexie profile subscription error:', err);
            setLoading(false);
          }
        });

        profileUnsubscribe = () => sub.unsubscribe();
        
        // Immediate sync
        getSyncService().then(service => service.syncUserProfile(currentUser.uid));
      } else {
        setProfile(null);
        setCustomClaims(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && profile) {
      getSyncManager().then(manager => {
        manager.setContext(user, profile.merchantId || null, customClaims?.admin || false, profile.role);
        manager.start();
      });
    } else {
      getSyncManager().then(manager => manager.stop());
    }
  }, [user, profile, customClaims]);

  const createProfileIfMissing = async (currentUser: User) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        const isAdminEmail = currentUser.email && ADMIN_EMAILS.includes(currentUser.email);
        const isManagerEmail = currentUser.email && MANAGER_EMAILS.includes(currentUser.email);
        
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilisateur',
          photoURL: currentUser.photoURL || '',
          role: isAdminEmail ? 'admin' : (isManagerEmail ? 'manager' : 'client'),
          createdAt: new Date()
        };

        await setDoc(userDocRef, {
          email: newProfile.email,
          display_name: newProfile.displayName,
          photo_url: newProfile.photoURL,
          role: newProfile.role,
          created_at: newProfile.createdAt
        });

        // Immediately sync to Dexie so the liveQuery picks it up
        const service = await getSyncService();
        await service.syncUserProfile(currentUser.uid);
      } else {
        // If it exists in Firestore but missing in Dexie, just sync
        const service = await getSyncService();
        await service.syncUserProfile(currentUser.uid);
      }
    } catch (err) {
      console.error('Error creating missing profile:', err);
      setLoading(false);
    }
  };

  const syncCustomClaims = async () => {
    if (!user || !profile) return;
    
    try {
      // Call our backend API to set custom claims
      const response = await fetch('/api/auth/set-custom-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          claims: {
            role: profile.role,
            merchantId: profile.merchantId || null,
            admin: profile.role === 'admin'
          }
        })
      });
      
      if (response.ok) {
        // Force token refresh to get new claims
        const tokenResult = await user.getIdTokenResult(true);
        setCustomClaims(tokenResult.claims);
      }
    } catch (error) {
      console.error('Error syncing custom claims:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    const isAdminEmail = email && ADMIN_EMAILS.includes(email);
    const isManagerEmail = email && MANAGER_EMAILS.includes(email);

    const newProfile: UserProfile = {
      uid: newUser.uid,
      email: email,
      displayName: fullName,
      photoURL: '',
      role: isAdminEmail ? 'admin' : (isManagerEmail ? 'manager' : 'client'),
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', newUser.uid), {
      email: newProfile.email,
      display_name: newProfile.displayName,
      photo_url: newProfile.photoURL,
      role: newProfile.role,
      created_at: newProfile.createdAt
    });

    setProfile(newProfile);
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Ensure we are in a browser environment
      if (typeof window === 'undefined') return;
      
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      // Let the caller handle standard error codes if they want
      // but keep the specific environment alerts here just in case
      if (error.code === 'auth/popup-blocked') {
        console.warn('Popup blocked, please allow popups for this site');
      } else if (error.code === 'auth/operation-not-allowed') {
        alert('La connexion avec Google n\'est pas activée dans la console Firebase.');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert('Ce domaine n\'est pas autorisé pour la connexion Google. Veuillez l\'ajouter dans la console Firebase.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isAdmin = customClaims?.admin || (!!user?.email && ADMIN_EMAILS.includes(user.email));
  const isManager = customClaims?.role === 'manager' || (!!user?.email && MANAGER_EMAILS.includes(user.email));
  const isSuperAdmin = !!user?.email && SUPER_ADMIN_EMAILS.includes(user.email);

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isManager,
    isSuperAdmin,
    syncCustomClaims,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  const isPartner = profile?.role === 'printer' || profile?.role === 'designer';

  return <AuthContext.Provider value={{ ...value, isPartner }}>{children}</AuthContext.Provider>;
};

