import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import HomePage from './pages/HomePage';
import PropertyDetails from './pages/PropertyDetails';
import BuyPage from './pages/BuyPage';
import RentPage from './pages/RentPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AIAssistant from './components/AIAssistant';
import NewProjectsPage from './pages/NewProjects';
import ContactPage from './pages/ContactPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import FloatingSocials from './components/FloatingSocials';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Admin Imports
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProperties from './pages/Admin/Properties';
import AddProperty from './pages/Admin/AddProperty';
import AdminInquiries from './pages/Admin/Inquiries';
import Leads from './pages/Admin/Leads';
import AdminChats from './pages/Admin/Chats';
import AdminProjects from './pages/Admin/Projects';
import AddProject from './pages/Admin/AddProject';
import SyncUpload from './pages/Admin/SyncUpload';
import AgencySync from './pages/Admin/AgencySync';
import CRM from './pages/Admin/CRM';

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ProjectProvider>
            <Routes>
              {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/buy" element={<BuyPage />} />
            <Route path="/rent" element={<RentPage />} />
            <Route path="/new-projects" element={<NewProjectsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            {/* Always send bare /admin to the login route so typing /admin works */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

            {/* Auth-protected admin dashboard */}
            <Route path="/admin/dashboard" element={
              <AdminProtected>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/properties" element={
              <AdminProtected>
                <AdminLayout>
                  <AdminProperties />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/properties/sync" element={
              <AdminProtected>
                <AdminLayout>
                  <SyncUpload />
                </AdminLayout>
              </AdminProtected>
            } />
            <Route path="/admin/properties/agency-sync" element={
              <AdminProtected>
                <AdminLayout>
                  <AgencySync />
                </AdminLayout>
              </AdminProtected>
            } />
            <Route path="/admin/crm" element={
              <AdminProtected>
                <AdminLayout>
                  <CRM />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/properties/add" element={
              <AdminProtected>
                <AdminLayout>
                  <AddProperty />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/properties/edit/:id" element={
              <AdminProtected>
                <AdminLayout>
                  <AddProperty />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/inquiries" element={
              <AdminProtected>
                <AdminLayout>
                  <AdminInquiries />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/leads" element={
              <AdminProtected>
                <AdminLayout>
                  <Leads />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/chats" element={
              <AdminProtected>
                <AdminLayout>
                  <AdminChats />
                </AdminLayout>
              </AdminProtected>
            } />

            <Route path="/admin/projects" element={
              <AdminProtected>
                <AdminLayout>
                  <AdminProjects />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/projects/add" element={
              <AdminProtected>
                <AdminLayout>
                  <AddProject />
                </AdminLayout>
              </AdminProtected>
            } />
            
            <Route path="/admin/projects/edit/:id" element={
              <AdminProtected>
                <AdminLayout>
                  <AddProject />
                </AdminLayout>
              </AdminProtected>
            } />

            {/* Fallback */}
            <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
          </Routes>
          <FloatingSocials />
          <AIAssistant />
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
