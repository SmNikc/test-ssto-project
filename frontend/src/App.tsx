// frontend/src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet
} from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TrainingModeProvider } from './contexts/TrainingModeContext';

import RoleBasedLayout from './layouts/RoleBasedLayout';

// Страницы
import OperatorDashboard from './pages/OperatorDashboard';
import ClientPortal from './pages/ClientPortal';
import ClientRequests from './pages/ClientRequests';
import ClientReports from './pages/ClientReports';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Компоненты
import Dashboard from './components/dashboard.component';
import RequestForm from './components/RequestForm';
import TestingForm from './components/testingForm.component';
import RequestList from './components/RequestList';
import SignalMonitor from './components/SignalMonitor';
import ReportsPage from './components/ReportsPage';
import MapView from './components/MapView';  // ДОБАВЛЕНО

type Role = 'operator' | 'client' | 'admin';

function ProtectedRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role as Role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

function NotFoundPage() {
  const { user } = useAuth();
  if (user?.role === 'client') return <Navigate to="/client" replace />;
  return <Navigate to="/operator" replace />;
}

function App() {
  return (
    <AuthProvider>
      <TrainingModeProvider>
        <Router>
          <Routes>
            {/* Публичные */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Блок оператора (и админа) */}
            <Route element={<ProtectedRoute allowedRoles={['operator', 'admin']} />}>
              <Route element={<RoleBasedLayout />}>
                <Route path="/operator" element={<OperatorDashboard />} />
                <Route path="/operator/requests" element={<RequestList />} />
                <Route path="/operator/request" element={<RequestForm />} />
                <Route path="/operator/signals" element={<SignalMonitor />} />
                <Route path="/operator/testing" element={<TestingForm />} />
                <Route path="/operator/reports" element={<ReportsPage />} />
                <Route path="/operator/dashboard" element={<Dashboard />} />
                <Route path="/operator/map" element={<MapView />} />  {/* ДОБАВЛЕНО */}
              </Route>
            </Route>

            {/* Блок клиента (и админа) */}
            <Route element={<ProtectedRoute allowedRoles={['client', 'admin']} />}>
              <Route element={<RoleBasedLayout />}>
                <Route path="/client" element={<ClientPortal />} />
                <Route path="/client/requests" element={<ClientRequests />} />
                <Route path="/client/reports" element={<ClientReports />} />
              </Route>
            </Route>

            {/* Обратная совместимость со старыми путями */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/requests" element={<Navigate to="/operator/requests" replace />} />
            <Route path="/request" element={<Navigate to="/operator/request" replace />} />
            <Route path="/signals" element={<Navigate to="/operator/signals" replace />} />
            <Route path="/testing" element={<Navigate to="/operator/testing" replace />} />
            <Route path="/reports" element={<Navigate to="/operator/reports" replace />} />
            <Route path="/dashboard" element={<Navigate to="/operator/dashboard" replace />} />

            {/* Глобальный fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </TrainingModeProvider>
    </AuthProvider>
  );
}

export default App;