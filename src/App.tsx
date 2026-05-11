import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BotsList } from './pages/BotsList';
import { BotBuilder } from './pages/BotBuilder';
import { Leads } from './pages/Leads';
import { Admin } from './pages/Admin';
import { Widget } from './pages/Widget';
import { Upgrade } from './pages/Upgrade';
import { Features } from './pages/Features';
import { Pricing } from './pages/Pricing';
import { GetStarted } from './pages/GetStarted';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Security } from './pages/Security';
import { Billing } from './pages/Billing';
import { Usage } from './pages/Usage';
import { Blog } from './pages/Blog';
import { Templates } from './pages/Templates';
import { BlogPost } from './pages/BlogPost';
import { Affiliates } from './pages/Affiliates';
import { PaymentManagement } from './pages/PaymentManagement';
import { AffiliateManagement } from './pages/AffiliateManagement';
import { AffiliateDashboardNew } from './pages/AffiliateDashboardNew';
import { useEffect } from 'react';
import { trackAffiliateReferral } from './utils/affiliateTracking';
import floodLogo from './assets/flood-logo.png';
import { PublicNav } from './components/PublicNav';
import { PublicFooter } from './components/PublicFooter';

function AffiliateTracker() {
  useEffect(() => {
    trackAffiliateReferral();
  }, []);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function PublicLayout() {
  return (
    <div className="public-page-bg min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

function App() {
  useEffect(() => {
    const logo = new Image();
    logo.src = floodLogo;
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AffiliateTracker />
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/widget/:botId" element={<Widget />} />

          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security" element={<Security />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/affiliates" element={<Affiliates />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="bots" element={<BotsList />} />
            <Route path="bots/new" element={<BotBuilder />} />
            <Route path="bots/:botId" element={<BotBuilder />} />
            <Route path="leads" element={<Leads />} />
            <Route path="usage" element={<Usage />} />
            <Route path="billing" element={<Billing />} />
            <Route path="upgrade" element={<Upgrade />} />
            <Route path="affiliate" element={<AffiliateDashboardNew />} />
          </Route>

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <DashboardLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Admin />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="affiliates" element={<AffiliateManagement />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
