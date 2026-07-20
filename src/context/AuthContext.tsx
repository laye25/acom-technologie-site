import { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const [isRestoring, setIsRestoring] = useState(typeof (window as any).electronAPI !== 'undefined');
  const isRestoringRef = useRef(isRestoring);

  useEffect(() => {
    isRestoringRef.current = isRestoring;
  }, [isRestoring]);

  const saveSettingsToDesktop = async (email?: string, password?: string) => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.saveDesktopSettings) {
      try {
        const currentSessionStr = localStorage.getItem('acom_offline_session');
        const currentProfileStr = localStorage.getItem('acom_offline_profile');
        const currentHash = localStorage.getItem('acom_offline_hash') || '';

        const currentSession = currentSessionStr ? JSON.parse(currentSessionStr) : null;
        const currentProfile = currentProfileStr ? JSON.parse(currentProfileStr) : null;

        // Si des identifiants valides sont fournis, les synchroniser de manière synchrone dans localStorage
        if (email) {
          localStorage.setItem('acom_offline_email', email.trim());
        }
        if (password) {
          localStorage.setItem('acom_offline_password_b64', safeBtoa(password));
        }

        // Récupérer de façon synchrone et sans race condition depuis localStorage
        const savedEmail = localStorage.getItem('acom_offline_email') || undefined;
        const savedPassword = localStorage.getItem('acom_offline_password_b64') || undefined;

        await electronAPI.saveDesktopSettings({
          savedEmail: savedEmail || null,
          savedPassword: savedPassword || null,
          acom_offline_session: currentSession,
          acom_offline_profile: currentProfile,
          acom_offline_hash: currentHash
        });
        console.log('AuthContext: Updated persistent desktop settings file successfully.');
      } catch (err) {
        console.error('AuthContext: Failed to save settings to desktop file:', err);
      }
    }
  };

  // Restaurer immédiatement la session locale si présente pour accélérer le démarrage et tolérer le mode hors-ligne
  useEffect(() => {
    const restoreSession = async () => {
      let storedSession = localStorage.getItem('acom_offline_session');
      let storedProfile = localStorage.getItem('acom_offline_profile');
      let storedHash = localStorage.getItem('acom_offline_hash');

      // Si on est sur Desktop Electron, essayer systématiquement de restaurer depuis le fichier physique
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.getDesktopSettings) {
        try {
          console.log('AuthContext: Tentative de récupération et synchronisation des paramètres depuis desktop_settings.json...');
          const result = await electronAPI.getDesktopSettings();
          if (result && result.success && result.settings) {
            const { acom_offline_session, acom_offline_profile, acom_offline_hash, savedEmail, savedPassword } = result.settings;
            
            if (savedEmail) {
              localStorage.setItem('acom_offline_email', savedEmail);
            }
            if (savedPassword) {
              localStorage.setItem('acom_offline_password_b64', savedPassword);
            }

            if (acom_offline_session) {
              console.log('AuthContext: Session physique trouvée pour:', acom_offline_session.profile?.email);
              
              localStorage.setItem('acom_offline_session', JSON.stringify(acom_offline_session));
              if (acom_offline_profile) {
                localStorage.setItem('acom_offline_profile', JSON.stringify(acom_offline_profile));
              }
              if (acom_offline_hash) {
                localStorage.setItem('acom_offline_hash', acom_offline_hash);
              }

              storedSession = JSON.stringify(acom_offline_session);
            }

            // Tenter une reconnexion automatique transparente en arrière-plan si en ligne
            if (savedEmail && savedPassword && navigator.onLine) {
              try {
                const decryptedPassword = safeAtob(savedPassword);
                console.log('AuthContext: Reconduction de session automatique en ligne avec les identifiants stockés...');
                await signInWithEmailAndPassword(auth, savedEmail, decryptedPassword);
                console.log('AuthContext: Reconnexion automatique en ligne réussie !');
              } catch (loginErr) {
                console.error('AuthContext: Échec de la reconnexion automatique en ligne:', loginErr);
              }
            }
          }
        } catch (err) {
          console.error('AuthContext: Erreur lors de la récupération des paramètres de bureau:', err);
        }
      }

      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          setUser(session.user);
          setProfile(session.profile);
          setCustomClaims(session.customClaims);
          setLoading(false);
          console.log('AuthContext: Restored cached session immediately:', session.profile.email);
        } catch (e) {
          console.error('Error reading cached session:', e);
        }
      }

      // Finish restoring session on Electron and stop loading spinner if no session
      setIsRestoring(false);
      if (!storedSession) {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

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
      
      // If we are still restoring the physical session from the file system, ignore null events
      if (isRestoringRef.current && !currentUser) {
        console.log('AuthContext: Ignoring null onAuthStateChanged event during active desktop restoration...');
        return;
      }
      
      const safetyTimeout = setTimeout(() => {
        setLoading(prev => {
          if (prev) {
            console.warn('AuthContext: Loading timed out after 4s. Forcing UI to load.');
            return false;
          }
          return prev;
        });
      }, 4000);

      // Cleanup previous profile listener
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (currentUser) {
        setUser(currentUser);
        // Fetch custom claims
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          setCustomClaims(tokenResult.claims);
        } catch (e) {
          console.warn('AuthContext: Could not fetch custom claims (offline fallback):', e);
          if (!customClaims) {
            setCustomClaims({
              admin: currentUser.email && ADMIN_EMAILS.includes(currentUser.email),
              role: (currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) ? 'admin' : 'client'
            });
          }
        }
        
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
                    createProfileIfMissing(currentUser).finally(() => setLoading(false));
                  } else {
                    setLoading(false);
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
        // Firebase Auth est null, vérification de la présence d'une session hors-ligne ou Desktop persistée
        const storedSession = localStorage.getItem('acom_offline_session');
        const isOffline = !navigator.onLine;
        const isElectron = typeof (window as any).electronAPI !== 'undefined';

        if (storedSession && (isOffline || isElectron)) {
          console.log('AuthContext: Firebase returned null but offline or Electron is active. Keeping current session.');
          try {
            const session = JSON.parse(storedSession);
            setUser(session.user);
            setProfile(session.profile);
            setCustomClaims(session.customClaims);
            setLoading(false);
          } catch (e) {
            console.error('Error parsing offline session:', e);
            setUser(null);
            setProfile(null);
            setCustomClaims(null);
            setLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setCustomClaims(null);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  // Mettre à jour la session locale dès que le profil ou l'utilisateur change
  useEffect(() => {
    if (user && profile) {
      const serializableUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      
      const claims = {
        admin: customClaims?.admin || false,
        role: profile.role,
        merchantId: profile.merchantId || null
      };

      const sessionObj = {
        user: serializableUser,
        profile: profile,
        customClaims: claims
      };

      localStorage.setItem('acom_offline_profile', JSON.stringify(profile));
      localStorage.setItem('acom_offline_session', JSON.stringify(sessionObj));

      // Synchroniser de façon sécurisée avec les réglages physiques persistants sur Desktop tout en conservant les identifiants
      saveSettingsToDesktop();
    }
  }, [user, profile, customClaims]);

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
    const trimmedEmail = email.trim();
    try {
      // Tenter la connexion normale en ligne
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      
      // Enregistrer le hash des identifiants pour les futures connexions hors-ligne
      const hash = await hashCredential(trimmedEmail, password);
      localStorage.setItem('acom_offline_hash', hash);

      // Sauvegarder les identifiants et la session sur Desktop
      await saveSettingsToDesktop(trimmedEmail, password);
    } catch (error: any) {
      console.error('Online login failed or network down:', error);
      
      // En cas de panne réseau ou hors-ligne, basculer sur l'authentification locale
      const isNetworkError = error.code === 'auth/network-request-failed' || !navigator.onLine;
      if (isNetworkError) {
        console.log('Attempting offline login fallback...');
        const cachedHash = localStorage.getItem('acom_offline_hash');
        const cachedProfileStr = localStorage.getItem('acom_offline_profile');
        
        if (cachedHash && cachedProfileStr) {
          const inputHash = await hashCredential(trimmedEmail, password);
          if (inputHash === cachedHash) {
            console.log('Offline login successful! Restoring local session.');
            const cachedProfile = JSON.parse(cachedProfileStr);
            
            const mockUser = {
              uid: cachedProfile.uid,
              email: cachedProfile.email,
              displayName: cachedProfile.displayName,
              photoURL: cachedProfile.photoURL,
              getIdTokenResult: async () => ({
                claims: {
                  admin: cachedProfile.role === 'admin',
                  role: cachedProfile.role,
                  merchantId: cachedProfile.merchantId || null,
                }
              }),
              getIdToken: async () => 'mock-offline-token'
            } as unknown as User;

            setUser(mockUser);
            setProfile(cachedProfile);
            setCustomClaims({
              admin: cachedProfile.role === 'admin',
              role: cachedProfile.role,
              merchantId: cachedProfile.merchantId || null
            });
            
            localStorage.setItem('acom_offline_session', JSON.stringify({
              user: {
                uid: mockUser.uid,
                email: mockUser.email,
                displayName: mockUser.displayName,
                photoURL: mockUser.photoURL
              },
              profile: cachedProfile,
              customClaims: {
                admin: cachedProfile.role === 'admin',
                role: cachedProfile.role,
                merchantId: cachedProfile.merchantId || null
              }
            }));

            // Sauvegarder les identifiants et la session sur Desktop
            await saveSettingsToDesktop(trimmedEmail, password);
            return;
          } else {
            throw new Error('Identifiants incorrects en mode hors-ligne.');
          }
        } else {
          throw new Error('Aucune session locale enregistrée. Veuillez vous connecter une première fois avec internet.');
        }
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const trimmedEmail = email.trim();
    const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    const newUser = userCredential.user;

    const isAdminEmail = trimmedEmail && ADMIN_EMAILS.includes(trimmedEmail);
    const isManagerEmail = trimmedEmail && MANAGER_EMAILS.includes(trimmedEmail);

    const newProfile: UserProfile = {
      uid: newUser.uid,
      email: trimmedEmail,
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

    // Enregistrer le hash pour les connexions hors-ligne
    const hash = await hashCredential(trimmedEmail, password);
    localStorage.setItem('acom_offline_hash', hash);

    setProfile(newProfile);

    // Sauvegarder les identifiants et la session sur Desktop
    await saveSettingsToDesktop(trimmedEmail, password);
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
    localStorage.removeItem('acom_offline_session');
    localStorage.removeItem('acom_offline_profile');
    localStorage.removeItem('acom_offline_hash');
    
    // Nettoyer également les paramètres physiques sur Desktop au logout
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.saveDesktopSettings) {
      try {
        await electronAPI.saveDesktopSettings({});
      } catch (err) {
        console.error('Failed to clear desktop settings file:', err);
      }
    }

    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
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

async function hashCredential(email: string, password: string): Promise<string> {
  const normalized = email.toLowerCase().trim() + ":" + password;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash (simple djb2 or sdbm hash) to prevent app from crashing in insecure HTTP dev environments
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'fallback_' + hash.toString();
}

function safeBtoa(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    console.error('safeBtoa failed, falling back to standard btoa:', e);
    return btoa(str);
  }
}

function safeAtob(str: string): string {
  try {
    return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error('safeAtob failed, falling back to standard atob:', e);
    return atob(str);
  }
}

