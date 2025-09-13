import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TrainingModeProvider } from './contexts/TrainingModeContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layouts
import RoleBasedLayout from './layouts/RoleBasedLayout';
import OperatorLayout from './layouts/OperatorLayout';
import ClientLayout from './layouts/ClientLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import OperatorDashboard from './pages/OperatorDashboard';
import ClientPortal from './pages/ClientPortal';

// Existing Components (уже существующие у вас)
import IntegratedSSTOSystem from './components/IntegratedSSTOSystem';
import RequestForm from './components/RequestForm';
import RequestList from './components/RequestList';
import SignalMonitor from './components/SignalMonitor';
import EnhancedSignalList from './components/EnhancedSignalList';
import ReportsPage from './components/ReportsPage';
import EmailSimulator from './components/EmailSimulator';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

const ProtectedRoute = ({ role, children }: { role: string; children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== role) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Operator routes */}
      <Route path="/operator" element={
        <ProtectedRoute role="operator">
          <OperatorLayout>
            <OperatorDashboard />
          </OperatorLayout>
        </ProtectedRoute>
      } />
      <Route path="/operator/dashboard" element={
        <ProtectedRoute role="operator">
          <OperatorLayout>
            <OperatorDashboard />
          </OperatorLayout>
        </ProtectedRoute>
      } />
      <Route path="/operator/requests" element={
        <ProtectedRoute role="operator">
          <OperatorLayout>
            <RequestList />
          </OperatorLayout>
        </ProtectedRoute>
      } />
      <Route path="/operator/signals" element={
        <ProtectedRoute role="operator">
          <OperatorLayout>
            <EnhancedSignalList />
          </OperatorLayout>
        </ProtectedRoute>
      } />
      <Route path="/operator/monitor" element={
        <ProtectedRoute role="operator">
          <OperatorLayout>
            <SignalMonitor />
          </OperatorLayout>
        </ProtectedRoute>
      } />
      <Route path="/operator/integrated" element={
        <ProtectedRoute role="operator">
          <OperatorLayout>
            <IntegratedSSTOSystem />
          </OperatorLayout>
        </ProtectedRoute>
      } />
      <Route path="/operator/reports" element={
        <ProtectedRoute role="operator">
          <OperatorLayout>
            <ReportsPage />
          </OperatorLayout>
        </ProtectedRoute>
      } />
      <Route path="/operator/email-simulator" element={
        <ProtectedRoute role="operator">
          <OperatorLayout>
            <EmailSimulator />
          </OperatorLayout>
        </ProtectedRoute>
      } />
      
      {/* Client routes */}
      <Route path="/client" element={
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientPortal />
          </ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/client/dashboard" element={
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientPortal />
          </ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/client/requests" element={
        <ProtectedRoute role="client">
          <ClientLayout>
            <RequestList />
          </ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/client/new-request" element={
        <ProtectedRoute role="client">
          <ClientLayout>
            <RequestForm />
          </ClientLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout>
            <IntegratedSSTOSystem />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Default redirect */}
      <Route path="/" element={
        user ? (
          <Navigate to={`/${user.role}`} />
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <TrainingModeProvider>
          <Router>
            <AppContent />
          </Router>
        </TrainingModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;