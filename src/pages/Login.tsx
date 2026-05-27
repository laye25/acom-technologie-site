import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db as firestoreDb } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
// import { isSupabaseConfigured } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, signOut } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const from = location.state?.from?.pathname + (location.state?.from?.search || '') || '/dashboard';

  const isDesktop = typeof window !== 'undefined' && (
    ('__TAURI__' in window) || 
    (window.process && (window.process as any).type) || 
    (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) || 
    (window.location && window.location.protocol && !['http:', 'https:'].includes(window.location.protocol))
  );
  
  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const isSaaSDomain = window.location.hostname.startsWith('saas.') || window.location.search.includes('mode=saas') || isDesktop;
      if (isSaaSDomain && from === '/dashboard') {
        navigate('/');
      } else {
        navigate(from);
      }
    }
  }, [user, navigate, from, isDesktop]);

  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('Acom Technologie');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { dbService } = await import('../services/dbService');
        const data = await dbService.settings.get('global');
        if (data) {
          if (data.brandName) setBrandName(data.brandName);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const [showGoogleRedirect, setShowGoogleRedirect] = useState(false);

  const handleGoogleSignIn = async (useRedirect = false) => {
    setGoogleLoading(true);
    setError(null);
    try {
      if (useRedirect) {
        const { auth } = await import('../firebase');
        const { signInWithRedirect, GoogleAuthProvider } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
        return; // Redirect happens
      }

      await signInWithGoogle();
      const isSaaSDomain = window.location.hostname.startsWith('saas.') || window.location.search.includes('mode=saas') || isDesktop;
      const targetUrl = isSaaSDomain && from === '/dashboard' ? '/' : from;
      navigate(targetUrl);
    } catch (error: any) {
      console.error('Google Auth error:', error);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        setError(error.code === 'auth/popup-blocked' 
          ? 'Les popups sont bloqués par votre navigateur.' 
          : 'La connexion a échoué (fenêtre fermée).');
        setShowGoogleRedirect(true);
      } else {
        setError(error.message || 'Une erreur est survenue lors de la connexion avec Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await resetPassword(formData.email);
      setSuccess('Un email de réinitialisation a été envoyé.');
      setIsResetting(false);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResetting) {
      handleResetPassword(e);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const isSaaSDomain = window.location.hostname.startsWith('saas.') || window.location.search.includes('mode=saas') || isDesktop;
      const targetUrl = isSaaSDomain && from === '/dashboard' ? '/' : from;
      
      if (isLogin) {
        const usernameInput = formData.email.trim().toLowerCase();
        
        if (!usernameInput.includes('@') || usernameInput.startsWith('prof_')) {
          // System generates 'prof_...' for teachers. Authenticate primarily via Firestore for cross-device support
          
          let matchingTeacher = null;
          
          try {
            // First try with Firestore
            const q = query(collection(firestoreDb, 'teachers'), where('username', '==', usernameInput));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0];
              matchingTeacher = { id: doc.id, ...doc.data() };
              
              // Cache it locally so subsequent offline lookups work 
              const { db: localDb } = await import('../db/db');
              if (matchingTeacher) {
                await localDb.teachers?.put(matchingTeacher);
              }
            } else {
               // Fallback: Check local Dexie DB in case we are fully offline
               const { db: localDb } = await import('../db/db');
               const allTeachers = await localDb.teachers?.toArray() || [];
               matchingTeacher = allTeachers.find((t: any) => t.username?.toLowerCase() === usernameInput);
            }
          } catch (err) {
             console.log("Firestore error or offline, falling back to local DB", err);
             // Fallback: Check local Dexie DB
             const { db: localDb } = await import('../db/db');
             const allTeachers = await localDb.teachers?.toArray() || [];
             matchingTeacher = allTeachers.find((t: any) => t.username?.toLowerCase() === usernameInput);
          }
          
          if (matchingTeacher && matchingTeacher.password?.trim() === formData.password.trim()) {
             const teacher = matchingTeacher;
             
             // Sign out of previous Firebase session if any to avoid administrator/teacher session conflicts
             try {
               await signOut();
             } catch (signOutErr) {
               console.warn("Could not sign out of previous Firebase session:", signOutErr);
             }

             localStorage.setItem('activeTeacherId', teacher.id);
             // Also store the merchant ID in case it's needed globally
             const mId = teacher.merchantId || teacher.merchant_id;
             if (mId) {
               localStorage.setItem('merchantId', mId);
             }
             navigate('/merchant/saas');
             return;
          } else {
             throw new Error("Identifiant ou Code PIN incorrect.");
          }
        }

        await signInWithEmail(formData.email, formData.password);
        navigate(targetUrl);
      } else {
        await signUpWithEmail(formData.email, formData.password, formData.fullName);
        setSuccess('Compte créé avec succès !');
        // Navigate immediately after signup since Firebase auto-logs in
        setTimeout(() => navigate(targetUrl), 1500);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl border border-black/5 shadow-xl p-8 md:p-10"
      >
        <div className="text-center mb-10">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-6 rounded-2xl overflow-hidden shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold text-primary">{brandName[0].toUpperCase()}</span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900">
            {isResetting 
              ? 'Réinitialiser' 
              : isLogin ? 'Bon retour !' : 'Créer un compte'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isResetting
              ? 'Entrez votre email pour réinitialiser votre mot de passe'
              : isLogin 
                ? 'Connectez-vous pour gérer vos projets' 
                : 'Rejoignez Acom Technologie dès aujourd\'hui'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && !isResetting && (
              <motion.div
                key="fullName"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    name="fullName"
                    required={!isLogin && !isResetting}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Jean Dupont"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email / Identifiant</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com ou prof_..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
              />
            </div>
          </div>

          {!isResetting && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Mot de passe</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  name="password"
                  required={!isResetting}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isResetting ? (
                  'Envoyer le lien'
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                    {isLogin ? 'Se connecter' : 'Créer un compte'}
                  </>
                )}
              </>
            )}
          </button>

          {isResetting && (
            <button
              type="button"
              onClick={() => setIsResetting(false)}
              className="w-full text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Retour à la connexion
            </button>
          )}
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OU</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <button
          onClick={() => handleGoogleSignIn(false)}
          disabled={loading || googleLoading}
          className="mt-6 w-full py-4 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading && !showGoogleRedirect ? (
            <div className="w-6 h-6 border-2 border-primary-light border-t-primary rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.9 0 3.51.64 4.85 1.91l3.6-3.6C18.23 1.3 15.35.5 12 .5 7.36.5 3.37 3.13 1.42 6.97l4.22 3.27C6.63 7.39 9.1 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.02 3.66-5 3.66-8.73z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.64 14.24c-.24-.71-.37-1.47-.37-2.24s.13-1.53.37-2.24L1.42 6.5C.51 8.15 0 10.01 0 12s.51 3.85 1.42 5.5l4.22-3.26z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-2.9 0-5.37-2.35-6.36-5.21L1.42 17.5c1.95 3.84 5.94 6 10.58 6z"
                />
              </svg>
              Continuer avec Google
            </>
          )}
        </button>

        {showGoogleRedirect && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-sm text-amber-800 mb-3">
              Popups bloqués. La connexion en ligne ne fonctionne pas ici.
            </p>
            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all text-sm"
            >
              Ouvrir l'application dans un nouvel onglet
            </button>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 font-bold text-primary hover:text-primary-hover transition-colors"
            >
              {isLogin ? 'Inscrivez-vous' : 'Connectez-vous'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
