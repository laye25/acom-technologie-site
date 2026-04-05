import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const isAdminEmail = currentUser.email && ADMIN_EMAILS.includes(currentUser.email);
        const isManagerEmail = currentUser.email && MANAGER_EMAILS.includes(currentUser.email);
        const expectedRole = isAdminEmail ? 'admin' : (isManagerEmail ? 'manager' : 'client');
        
        if (data.role !== expectedRole && uid) {
          try {
            await setDoc(doc(db, 'users', uid), { ...data, role: expectedRole }, { merge: true });
            console.log(`Updated user ${uid} role to ${expectedRole}`);
          } catch (err) {
            console.error("Error updating user role:", err);
          }
        }

        setProfile({
          uid: docSnap.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: expectedRole, // Use expectedRole to ensure UI is consistent even if write fails
          createdAt: data.createdAt
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

        await setDoc(doc(db, 'users', currentUser.uid), newProfile);
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
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: fullName });
    
    // No verification email sent as per user request
    
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

    await setDoc(doc(db, 'users', newUser.uid), newProfile);
    setProfile(newProfile);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await firebaseSendPasswordResetEmail(auth, email);
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

