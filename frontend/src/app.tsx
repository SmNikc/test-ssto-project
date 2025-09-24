import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TrainingModeProvider } from './contexts/TrainingModeContext';
import RoleBasedLayout from './layouts/RoleBasedLayout';
import OperatorDashboard from './pages/OperatorDashboard';
import ClientPortal from './pages/ClientPortal';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage'; // Добавить импорт

const ProtectedRoute = ({ role, children }: { role: string; children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== role) {
    return <Navigate to="/unauthorized" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <TrainingModeProvider>
        <Router>
          <Routes>
            <Route path="/operator/*" element={
              <ProtectedRoute role="operator">
                <RoleBasedLayout>
                  <OperatorDashboard />
                </RoleBasedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/client/*" element={
              <ProtectedRoute role="client">
                <RoleBasedLayout>
                  <ClientPortal />
                </RoleBasedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} /> {/* Добавить эту строку */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </TrainingModeProvider>
    </AuthProvider>
  );
}

export default App;