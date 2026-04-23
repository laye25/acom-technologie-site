import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('AuthContext: onAuthStateChanged - currentUser:', currentUser);
      setUser(currentUser);
      if (currentUser) {
        // Fetch custom claims
        const tokenResult = await currentUser.getIdTokenResult();
        setCustomClaims(tokenResult.claims);
        
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
        setCustomClaims(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const fetchProfile = async (currentUser: User) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const isAdminEmail = currentUser.email && ADMIN_EMAILS.includes(currentUser.email);
        const isManagerEmail = currentUser.email && MANAGER_EMAILS.includes(currentUser.email);
        const expectedRole = isAdminEmail ? 'admin' : (isManagerEmail ? 'manager' : 'client');
        
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: data.display_name || currentUser.displayName || 'Utilisateur',
          photoURL: data.photo_url || currentUser.photoURL || '',
          role: data.role || expectedRole,
          partnerStatus: data.partnerStatus,
          partnerDetails: data.partnerDetails,
          createdAt: data.created_at?.toDate() || new Date()
        });
      } else {
        // Create profile if it doesn't exist
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
        
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
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
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/popup-blocked') {
        alert('Veuillez autoriser les popups pour vous connecter avec Google.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Popup closed by user');
      } else {
        alert('Erreur lors de la connexion avec Google : ' + error.message);
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

