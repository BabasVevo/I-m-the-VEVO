import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PosPage } from '@/pages/PosPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { StockPage } from '@/pages/StockPage';
import { SalesPage } from '@/pages/SalesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PlaceholderPages } from '@/pages/PlaceholderPages';
import { NAV_SECTIONS } from '@/lib/constants';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-navy-950">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  const implementedPaths = ['/dashboard', '/pos', '/sales', '/products', '/categories', '/stock', '/settings'];

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={session ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={session ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        element={
          session ? <MainLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route path="/dashboard" element={
          <PermissionGuard permission="dashboard.view"><DashboardPage /></PermissionGuard>
        } />

        <Route path="/pos" element={
          <PermissionGuard permission="pos.sell"><PosPage /></PermissionGuard>
        } />

        <Route path="/sales" element={
          <PermissionGuard permission="sales.view"><SalesPage /></PermissionGuard>
        } />

        <Route path="/products" element={
          <PermissionGuard permission="products.view"><ProductsPage /></PermissionGuard>
        } />

        <Route path="/categories" element={
          <PermissionGuard permission="categories.manage"><CategoriesPage /></PermissionGuard>
        } />

        <Route path="/stock" element={
          <PermissionGuard permission="stock.view"><StockPage /></PermissionGuard>
        } />

        {/* All other nav placeholder pages */}
        {NAV_SECTIONS.flatMap((s) => s.items)
          .filter((item) => !implementedPaths.includes(item.path))
          .map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                <PermissionGuard permission={item.permission}>
                  <PlaceholderPages item={item} />
                </PermissionGuard>
              }
            />
          ))}

        <Route path="/settings" element={
          <PermissionGuard permission="settings.manage"><SettingsPage /></PermissionGuard>
        } />
      </Route>

      <Route path="/" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
