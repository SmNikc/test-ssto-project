import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import OperatorLayout from './OperatorLayout';
import ClientLayout from './ClientLayout';
import AdminLayout from './AdminLayout';
import LoginPage from '../pages/LoginPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

const RoleBasedLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) return <LoginPage />;
  
  switch(user.role) {
    case 'operator':
      return <OperatorLayout>{children}</OperatorLayout>;
    case 'client':
      return <ClientLayout>{children}</ClientLayout>;
    case 'admin':
      return <AdminLayout>{children}</AdminLayout>;
    default:
      return <UnauthorizedPage />;
  }
};

export default RoleBasedLayout;