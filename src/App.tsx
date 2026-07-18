import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './ThemeProvider';
import { CacheProvider } from './context/CacheContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
const PartnerPortal = React.lazy(() => import('./pages/PartnerPortal').then(module => ({ default: module.PartnerPortal })));
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const OrderForm = React.lazy(() => import('./pages/OrderForm'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const MerchantSaaS = React.lazy(() => import('./pages/MerchantSaaS'));
const DesignEditor = React.lazy(() => import('./pages/DesignEditor'));
const AcomZone = React.lazy(() => import('./pages/AcomZone'));
const AcomZoneMerchant = React.lazy(() => import('./pages/AcomZoneMerchant'));
const Chat = React.lazy(() => import('./pages/Chat'));
const OrderDetails = React.lazy(() => import('./pages/OrderDetails'));
const OrderQuote = React.lazy(() => import('./pages/OrderQuote'));
const OrderInvoice = React.lazy(() => import('./pages/OrderInvoice'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const QuoteRequest = React.lazy(() => import('./pages/QuoteRequest'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Blog = React.lazy(() => import('./pages/Blog'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const POS = React.lazy(() => import('./pages/POS'));
const TeacherPortal = React.lazy(() => import('./pages/TeacherPortal'));
const StudentPortal = React.lazy(() => import('./pages/StudentPortal'));
const ParentPortal = React.lazy(() => import('./pages/ParentPortal'));
const OrderTracking = React.lazy(() => import('./pages/OrderTracking'));
// Removed direct imports for lazy loading

const Pricing = React.lazy(() => import('./pages/Pricing'));
const SaaSSolutions = React.lazy(() => import('./pages/SaaSSolutions'));
const ServiceDetails = React.lazy(() => import('./pages/ServiceDetails'));
// Removed direct imports for lazy loading

const EmailPreview = React.lazy(() => import('./pages/EmailPreview'));
const ReleaseNotes = React.lazy(() => import('./pages/ReleaseNotes'));
const About = React.lazy(() => import('./pages/About'));
const BecomePartner = React.lazy(() => import('./pages/BecomePartner'));
const PartnerTerms = React.lazy(() => import('./pages/PartnerTerms'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
import AIAssistant from './components/AIAssistant';
import { CommandPalette } from './components/CommandPalette';

import { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const isDesktop = typeof window !== 'undefined' && (
  ('__TAURI__' in window) || 
  (window.process && (window.process as any).type) || 
  (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) || 
  (window.location && window.location.protocol && !['http:', 'https:'].includes(window.location.protocol))
);
const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
const Router = (isDesktop || isNative) ? HashRouter : BrowserRouter;

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
  const isSaaSDomain = window.location.hostname.startsWith('saas.') || window.location.search.includes('mode=saas') || (typeof window !== 'undefined' && (isDesktop || isNative));

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
            <Route path="/acomzone" element={<AcomZone />} />
            <Route path="/acomzone/:merchantId" element={<AcomZoneMerchant />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/prix" element={<Pricing />} />
            <Route path="/design-editor" element={<ProtectedRoute><DesignEditor /></ProtectedRoute>} />
            <Route path="/chat/:orderId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/order-details/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
            <Route path="/quote/:orderId" element={<ProtectedRoute><OrderQuote /></ProtectedRoute>} />
            <Route path="/invoice/:orderId" element={<ProtectedRoute><OrderInvoice /></ProtectedRoute>} />
            <Route path="/suivi-commande/:orderId" element={<OrderTracking />} />
            <Route path="/suivi/:orderId" element={<OrderTracking />} />
            <Route path="/messages" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </React.Suspense>
      </main>
      
      {!hideFooter && <Footer />}
      {!isEditor && location.pathname !== '/manager/pos' && <AIAssistant />}
      {!isSaaSDomain && location.pathname !== '/manager/pos' && <NetworkStatusIndicator position="bottom-right" />}
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
