import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import CreateContractPage from './pages/CreateContractPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// プライベートルートコンポーネント
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// パブリックルートコンポーネント（認証済みの場合はダッシュボードにリダイレクト）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Box>{children}</Box>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* パブリックルート */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* プライベートルート */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/contracts"
        element={
          <PrivateRoute>
            <ContractsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/contracts/new"
        element={
          <PrivateRoute>
            <CreateContractPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/contracts/:id"
        element={
          <PrivateRoute>
            <ContractDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/contracts/:id/edit"
        element={
          <PrivateRoute>
            <CreateContractPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />

      {/* デフォルトルート */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 ページ */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;