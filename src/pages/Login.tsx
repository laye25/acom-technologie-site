import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      setError("La connexion n'est pas possible car les clés Supabase sont manquantes dans l'environnement de déploiement.");
      return;
    }
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google Auth error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('La fenêtre de connexion a été fermée. Rafraîchissement de la page...');
        setTimeout(() => window.location.reload(), 1500);
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

    if (!isSupabaseConfigured) {
      setError("La connexion n'est pas possible car les clés Supabase sont manquantes dans l'environnement de déploiement.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        await signInWithEmail(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        await signUpWithEmail(formData.email, formData.password, formData.fullName);
        setSuccess('Compte créé avec succès !');
        // Navigate to dashboard immediately after signup since Firebase auto-logs in
        setTimeout(() => navigate('/dashboard'), 1500);
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
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-primary">A</span>
          </div>
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
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
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
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="mt-6 w-full py-4 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
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
