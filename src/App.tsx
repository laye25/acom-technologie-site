import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './ThemeProvider';
import { CacheProvider } from './context/CacheContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { PartnerPortal } from './pages/PartnerPortal';
import Home from './pages/Home';
import Login from './pages/Login';
import OrderForm from './pages/OrderForm';
import Dashboard from './pages/Dashboard';
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const MerchantSaaS = React.lazy(() => import('./pages/MerchantSaaS'));
const DesignEditor = React.lazy(() => import('./pages/DesignEditor'));
import Chat from './pages/Chat';
import OrderDetails from './pages/OrderDetails';
import OrderQuote from './pages/OrderQuote';
import OrderInvoice from './pages/OrderInvoice';
import Portfolio from './pages/Portfolio';
import QuoteRequest from './pages/QuoteRequest';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import POS from './pages/POS';
const TeacherPortal = React.lazy(() => import('./pages/TeacherPortal'));
const StudentPortal = React.lazy(() => import('./pages/StudentPortal'));
const ParentPortal = React.lazy(() => import('./pages/ParentPortal'));
// Removed direct imports for lazy loading

import Pricing from './pages/Pricing';
import SaaSSolutions from './pages/SaaSSolutions';
import ServiceDetails from './pages/ServiceDetails';
// Removed direct imports for lazy loading

import EmailPreview from './pages/EmailPreview';
import ReleaseNotes from './pages/ReleaseNotes';
import About from './pages/About';
import BecomePartner from './pages/BecomePartner';
import PartnerTerms from './pages/PartnerTerms';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AIAssistant from './components/AIAssistant';
import { CommandPalette } from './components/CommandPalette';
import { Capacitor } from '@capacitor/core';

import { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const isCapacitor = typeof window !== 'undefined' && Capacitor.isNativePlatform();
const isDesktop = typeof window !== 'undefined' && (
  ('__TAURI__' in window) || 
  (window.process && (window.process as any).type) || 
  (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) || 
  (window.location && window.location.protocol && !['http:', 'https:'].includes(window.location.protocol))
);
const isNativeApp = isDesktop || isCapacitor;
const Router = isNativeApp ? HashRouter : BrowserRouter;

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const activeTeacherId = localStorage.getItem('activeTeacherId');
  const activeParentId = localStorage.getItem('activeParentId');
  const activeStudentId = localStorage.getItem('activeStudentId');

  if (loading) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Chargement de votre session...</div>;
  if (!user && !activeTeacherId && !activeParentId && !activeStudentId) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user && (activeTeacherId || activeParentId || activeStudentId) && adminOnly) return <Navigate to="/" />; // Teachers, Parents, and Students cannot access adminOnly routes
  if (user && adminOnly && !(isAdmin || isManager)) return <Navigate to="/" />;

  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  const isEditor = location.pathname === '/design-editor';
  
  // Détection du sous-domaine SaaS (ou simulation via ?mode=saas)
  const isSaaSDomain = window.location.hostname.startsWith('saas.') || window.location.search.includes('mode=saas') || (typeof window !== 'undefined' && isNativeApp);

  // Pour le SaaS et la session Enseignant/Parent/Eleve, on cache le header et le footer pour faire plus "Application" personnalisé
  const isPortalLayout = location.pathname.startsWith('/portal/') || location.pathname.startsWith('/merchant/');
  
  const hideNavbar = isEditor || isSaaSDomain || isPortalLayout;
  const hideFooter = isEditor || isSaaSDomain || isPortalLayout;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-primary-light selection:text-primary">
      <Toaster position="top-center" reverseOrder={false} />
      <CommandPalette />
      {!hideNavbar && <Navbar />}
      <main key={location.key} className={isEditor ? 'h-screen' : ''}>
        <React.Suspense fallback={<div className="p-8 text-center">Chargement...</div>}>
          <Routes>
            {isSaaSDomain ? (
              <Route path="/" element={<ProtectedRoute><MerchantSaaS /></ProtectedRoute>} />
            ) : (
              <Route path="/" element={<Home />} />
            )}
            <Route path="/login" element={<Login />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:postId" element={<BlogPost />} />
            <Route path="/service/:serviceId" element={<ServiceDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/devenir-partenaire" element={<BecomePartner />} />
            <Route path="/conditions-partenaires" element={<PartnerTerms />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/release-notes" element={<ReleaseNotes />} />
            <Route path="/order/:serviceId" element={<ProtectedRoute><OrderForm /></ProtectedRoute>} />
            <Route path="/quote-request" element={<ProtectedRoute><QuoteRequest /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/email-preview" element={<ProtectedRoute adminOnly><EmailPreview /></ProtectedRoute>} />
            <Route path="/manager/pos" element={<ProtectedRoute adminOnly><POS /></ProtectedRoute>} />
            <Route path="/merchant/saas" element={<ProtectedRoute><MerchantSaaS /></ProtectedRoute>} />
            <Route path="/portal/student" element={<ProtectedRoute><StudentPortal /></ProtectedRoute>} />
            <Route path="/portal/parent" element={<ProtectedRoute><ParentPortal /></ProtectedRoute>} />
            <Route path="/portal/teacher" element={<ProtectedRoute><TeacherPortal /></ProtectedRoute>} />
            <Route path="/partner-portal" element={<ProtectedRoute><PartnerPortal /></ProtectedRoute>} />
            <Route path="/solutions-saas" element={<SaaSSolutions />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/prix" element={<Pricing />} />
            <Route path="/design-editor" element={<ProtectedRoute><DesignEditor /></ProtectedRoute>} />
            <Route path="/chat/:orderId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/order-details/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
            <Route path="/quote/:orderId" element={<ProtectedRoute><OrderQuote /></ProtectedRoute>} />
            <Route path="/invoice/:orderId" element={<ProtectedRoute><OrderInvoice /></ProtectedRoute>} />
            <Route path="/messages" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </React.Suspense>
      </main>
      
      {!hideFooter && <Footer />}
      {!isEditor && <AIAssistant />}
      {!isSaaSDomain && <NetworkStatusIndicator position="bottom-right" />}
    </div>
  );
}

// Main Application Component - Acom Technologie
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <CacheProvider>
            <ThemeProvider>
              <Router>
                <AppContent />
              </Router>
            </ThemeProvider>
          </CacheProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
