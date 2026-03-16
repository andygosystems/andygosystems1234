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
            
            <Route path="/admin" element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            } />
            
            <Route path="/admin/properties" element={
              <AdminLayout>
                <AdminProperties />
              </AdminLayout>
            } />
            
            <Route path="/admin/properties/sync" element={
              <AdminLayout>
                <SyncUpload />
              </AdminLayout>
            } />
            <Route path="/admin/properties/agency-sync" element={
              <AdminLayout>
                <AgencySync />
              </AdminLayout>
            } />
            <Route path="/admin/crm" element={
              <AdminLayout>
                <CRM />
              </AdminLayout>
            } />
            
            <Route path="/admin/properties/add" element={
              <AdminLayout>
                <AddProperty />
              </AdminLayout>
            } />
            
            <Route path="/admin/properties/edit/:id" element={
              <AdminLayout>
                <AddProperty />
              </AdminLayout>
            } />
            
            <Route path="/admin/inquiries" element={
              <AdminLayout>
                <AdminInquiries />
              </AdminLayout>
            } />
            
            <Route path="/admin/leads" element={
              <AdminLayout>
                <Leads />
              </AdminLayout>
            } />
            
            <Route path="/admin/chats" element={
              <AdminLayout>
                <AdminChats />
              </AdminLayout>
            } />

            <Route path="/admin/projects" element={
              <AdminLayout>
                <AdminProjects />
              </AdminLayout>
            } />
            
            <Route path="/admin/projects/add" element={
              <AdminLayout>
                <AddProject />
              </AdminLayout>
            } />
            
            <Route path="/admin/projects/edit/:id" element={
              <AdminLayout>
                <AddProject />
              </AdminLayout>
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
