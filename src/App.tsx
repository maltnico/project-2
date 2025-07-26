import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContractsPage from './pages/ContractsPage';
import DocumentsPage from './pages/DocumentsPage';
import FeaturesPage from './pages/FeaturesPage';
import ResourcesPage from './pages/ResourcesPage';
import PricingPage from './pages/PricingPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        {/* Page d'accueil publique */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LandingPage />
          } 
        />
        
        {/* Pages publiques avec layout */}
        <Route 
          path="/contrats" 
          element={
            <PublicLayout>
              <ContractsPage />
            </PublicLayout>
          } 
        />
        
        <Route 
          path="/documents" 
          element={
            <PublicLayout>
              <DocumentsPage />
            </PublicLayout>
          } 
        />
        
        <Route 
          path="/fonctionnalites" 
          element={
            <PublicLayout>
              <FeaturesPage />
            </PublicLayout>
          } 
        />
        
        <Route 
          path="/ressources" 
          element={
            <PublicLayout>
              <ResourcesPage />
            </PublicLayout>
          } 
        />
        
        <Route 
          path="/tarifs" 
          element={
            <PublicLayout>
              <PricingPage />
            </PublicLayout>
          } 
        />
        
        {/* Page de login */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        
        {/* Back office client protégé */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirection par défaut */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
