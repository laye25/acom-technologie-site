import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/CacheContext';
import LanguageSwitcher from './LanguageSwitcher';
import { NotificationCenter } from './NotificationCenter';
import { dbService } from '../services/dbService';
import { LayoutDashboard, LogOut, Menu, X, ShoppingBag, MessageSquare, User, ChevronRight, Calculator, Store, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DesignSelectorModal from './design/DesignSelectorModal';
import { OptimizedImage } from './OptimizedImage';


const Navbar = () => {
  const { user, profile, isAdmin, isManager, isSuperAdmin, isPartner, signOut } = useAuth();
  const { prefetchCollection } = useDataCache();
  const hasAdminAccess = isAdmin || isManager;
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [brandName, setBrandName] = useState('Acom Technologie');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hasMerchantAccount, setHasMerchantAccount] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMerchant = async () => {
      if (user) {
        try {
          const { db } = await import('../db/db');
          let localMerchant = await db.merchants.where('owner_id').equals(user.uid).first();
          if (!localMerchant) {
            const allMerchants = await db.merchants.toArray();
            localMerchant = allMerchants.find(m => m.ownerId === user.uid || m.owner_id === user.uid);
          }
          if (localMerchant) {
            setHasMerchantAccount(true);
            return;
          }
          const merchant = await dbService.merchants.getByOwner(user.uid);
          setHasMerchantAccount(!!merchant);
        } catch (error) {
          console.error('Error checking merchant account:', error);
        }
      }
    };
    checkMerchant();
  }, [user]);

  const isDarkHeroPage = ['/', '/solutions-saas'].includes(location.pathname);
  const useWhiteText = isDarkHeroPage && !scrolled;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
      // Hard refresh to clear all auth state and avoid popup errors
      window.location.href = window.location.origin + '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = window.location.origin + '/login';
    }
  };

  const handlePrefetch = (path: string) => {
    // Point 3: Intelligent Prefetching
    if (path === '/portfolio') {
      prefetchCollection('portfolio');
    } else if (path === '/blog') {
      prefetchCollection('blog_posts');
    } else if (path === '/') {
      prefetchCollection('services');
    }
  };

  const navLinks = [
    { name: 'Services', path: '/' },
    { name: 'Design', path: '/design-editor' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Tarifs', path: '/prix' },
    { name: 'Partenaires', path: '/devenir-partenaire' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  const authLinks = user ? [
    { name: 'Commandes', path: (isAdmin || isManager) ? '/admin?tab=orders' : '/dashboard?tab=orders', icon: ShoppingBag },
    { name: 'Messages', path: (isAdmin || isManager) ? '/admin?tab=messages' : '/dashboard?tab=messages', icon: MessageSquare },
    ...(isPartner ? [{ name: 'Portail Partenaire', path: '/partner-portal', icon: Palette }] : []),
    ...(hasMerchantAccount || isAdmin || isManager ? [{ name: 'Ma Boutique', path: '/merchant/saas', icon: Store }] : []),
    ...(isManager || isSuperAdmin ? [{ name: 'Caisse', path: '/manager/pos', icon: Calculator }] : []),
    ...(hasAdminAccess ? [{ name: 'Admin', path: '/admin', icon: LayoutDashboard }] : []),
  ] : [];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-xl border-b border-black/5 py-3' 
            : 'bg-transparent py-5'
        }`}
      >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="group flex items-center space-x-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={brandName} 
                className={`h-12 sm:h-14 w-auto object-contain rounded-xl overflow-hidden group-hover:scale-105 transition-transform ${useWhiteText ? 'mix-blend-screen' : ''}`}
              />
            ) : (
              <>
                <img 
                  src="/logo.svg" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = document.getElementById('logo-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div id="logo-fallback" className="hidden w-10 h-10 bg-primary rounded-xl items-center justify-center text-white font-logo text-2xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform relative overflow-hidden">
                  <span className="relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">{brandName.charAt(0).toUpperCase()}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-xl font-display font-bold tracking-tight leading-none transition-colors ${useWhiteText ? 'text-white' : 'text-ink'}`}>
                    {brandName.split(' ')[0].toUpperCase()}
                  </span>
                  {brandName.split(' ').length > 1 && (
                    <span className={`text-[10px] font-mono uppercase tracking-[0.2em] leading-none mt-1 transition-colors ${useWhiteText ? 'text-white/60' : 'text-gray-400'}`}>
                      {brandName.split(' ').slice(1).join(' ')}
                    </span>
                  )}
                </div>
              </>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              link.name === 'Design' ? (
                <button
                  key={link.name}
                  onClick={() => setIsDesignModalOpen(true)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors group ${
                    useWhiteText ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  onMouseEnter={() => handlePrefetch(link.path)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors group ${
                    location.pathname === link.path 
                      ? 'text-primary' 
                      : useWhiteText ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div 
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              )
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher light={useWhiteText} />
            {user && <NotificationCenter />}
            {user ? (
              <div className={`flex items-center space-x-2 p-1 rounded-full border transition-all ${
                useWhiteText ? 'bg-white/10 border-white/10' : 'bg-gray-50 border-black/5'
              }`}>
                {authLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`p-2 rounded-full transition-all ${
                      location.pathname === link.path 
                        ? 'bg-white text-primary shadow-sm' 
                        : useWhiteText ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-primary hover:bg-white'
                    }`}
                    title={link.name}
                  >
                    <link.icon className="w-4 h-4" />
                  </Link>
                ))}
                <div className={`w-px h-4 mx-1 ${useWhiteText ? 'bg-white/20' : 'bg-gray-200'}`} />
                <Link to="/profile" className="flex items-center pr-2 group">
                  <OptimizedImage
                    src={profile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || user?.email?.split('@')[0] || 'User')}&background=7c3aed&color=fff`}
                    alt="Profile"
                    width={100}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm group-hover:scale-110 transition-transform"
                  />
                </Link>
                <button
                  onClick={handleLogout}
                  className={`p-2 transition-colors ${useWhiteText ? 'text-white/40 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`group relative inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-full overflow-hidden transition-all shadow-lg ${
                  useWhiteText 
                    ? 'bg-white text-ink hover:bg-primary hover:text-white shadow-white/10' 
                    : 'bg-ink text-white hover:bg-primary shadow-black/10'
                }`}
              >
                <span className="relative z-10">Connexion</span>
                <ChevronRight className="relative z-10 ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center space-x-2 md:hidden">
            <LanguageSwitcher light={useWhiteText} />
            {user && <NotificationCenter />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-xl transition-colors ${
                useWhiteText ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-black/5 shadow-2xl md:hidden"
          >
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {navLinks.map((link) => (
                  link.name === 'Design' ? (
                    <button
                      key={link.name}
                      onClick={() => {
                        setIsDesignModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-center px-4 py-3 rounded-2xl text-sm font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-center px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        location.pathname === link.path 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                ))}
              </div>
              
              {user && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-2xl">
                    <OptimizedImage
                      src={profile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || user?.email?.split('@')[0] || 'User')}&background=7c3aed&color=fff`}
                      alt="Profile"
                      width={100}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{profile?.displayName || 'Utilisateur'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {authLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-4 py-3 rounded-2xl text-sm font-bold bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        <link.icon className="w-4 h-4 mr-2" />
                        {link.name}
                      </Link>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center px-4 py-3 rounded-2xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </button>
                </div>
              )}
              
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
                >
                  Se connecter
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>

      <DesignSelectorModal 
        isOpen={isDesignModalOpen} 
        onClose={() => setIsDesignModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;
