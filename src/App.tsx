import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './ThemeProvider';
import { CacheProvider } from './context/CacheContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import OrderForm from './pages/OrderForm';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
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
import MerchantSaaS from './pages/MerchantSaaS';
import Pricing from './pages/Pricing';
import SaaSSolutions from './pages/SaaSSolutions';
import ServiceDetails from './pages/ServiceDetails';
import DesignEditor from './pages/DesignEditor';
import ReleaseNotes from './pages/ReleaseNotes';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AIAssistant from './components/AIAssistant';

import { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading, isAdmin, isManager } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Chargement de votre session...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !(isAdmin || isManager)) return <Navigate to="/" />;

  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  const isEditor = location.pathname === '/design-editor';

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-primary-light selection:text-primary">
      <Toaster position="top-center" reverseOrder={false} />
      {!isEditor && <Navbar />}
      <main className={isEditor ? 'h-screen' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:postId" element={<BlogPost />} />
          <Route path="/service/:serviceId" element={<ServiceDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/release-notes" element={<ReleaseNotes />} />
          <Route path="/order/:serviceId" element={<ProtectedRoute><OrderForm /></ProtectedRoute>} />
          <Route path="/quote-request" element={<ProtectedRoute><QuoteRequest /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/manager/pos" element={<ProtectedRoute adminOnly><POS /></ProtectedRoute>} />
          <Route path="/merchant/saas" element={<ProtectedRoute><MerchantSaaS /></ProtectedRoute>} />
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
      </main>
      
      {!isEditor && <Footer />}
      {!isEditor && <AIAssistant />}
    </div>
  );
}

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
