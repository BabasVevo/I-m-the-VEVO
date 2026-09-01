import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
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
import { CustomersPage } from '@/pages/CustomersPage';
import { CustomerSegmentsPage } from '@/pages/CustomerSegmentsPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { PurchasesPage } from '@/pages/PurchasesPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ReportsPage } from '@/pages/ReportsPage';
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

  const implementedPaths = [
    '/dashboard', 
    '/pos', 
    '/sales', 
    '/products', 
    '/categories', 
    '/stock', 
    '/purchases',
    '/suppliers',
    '/expenses',
    '/approvals',
    '/notifications',
    '/customers',
    '/segments',
    '/customers/segments',
    '/reports',
    '/analytics',
    '/employees',
    '/staff',
    '/roles',
    '/activity-log',
    '/audit-log',
    '/branches',
    '/locations',
    '/settings'
  ];

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

        <Route path="/purchases" element={
          <PermissionGuard permission="purchases.view"><PurchasesPage /></PermissionGuard>
        } />

        <Route path="/suppliers" element={
          <PermissionGuard permission="suppliers.view"><SuppliersPage /></PermissionGuard>
        } />

        <Route path="/expenses" element={
          <PermissionGuard permission="expenses.view"><ExpensesPage /></PermissionGuard>
        } />

        <Route path="/approvals" element={
          <PermissionGuard permission="expenses.view"><ApprovalsPage /></PermissionGuard>
        } />

        <Route path="/notifications" element={
          <NotificationsPage />
        } />

        <Route path="/reports" element={
          <PermissionGuard permission="reports.view"><ReportsPage /></PermissionGuard>
        } />

        <Route path="/analytics" element={
          <PermissionGuard permission="analytics.view"><ReportsPage /></PermissionGuard>
        } />

        <Route path="/customers" element={
          <PermissionGuard permission="customers.view"><CustomersPage /></PermissionGuard>
        } />

        <Route path="/segments" element={
          <PermissionGuard permission="segments.manage"><CustomerSegmentsPage /></PermissionGuard>
        } />

        <Route path="/customers/segments" element={
          <PermissionGuard permission="segments.manage"><CustomerSegmentsPage /></PermissionGuard>
        } />

        <Route path="/employees" element={
          <PermissionGuard permission="employees.view"><EmployeesPage /></PermissionGuard>
        } />

        <Route path="/staff" element={
          <PermissionGuard permission="employees.view"><EmployeesPage /></PermissionGuard>
        } />

        <Route path="/roles" element={
          <PermissionGuard permission="roles.manage"><EmployeesPage /></PermissionGuard>
        } />

        <Route path="/activity-log" element={
          <PermissionGuard permission="activity.view"><EmployeesPage /></PermissionGuard>
        } />

        <Route path="/audit-log" element={
          <PermissionGuard permission="activity.view"><EmployeesPage /></PermissionGuard>
        } />

        <Route path="/branches" element={
          <PermissionGuard permission="branches.view"><BranchesPage /></PermissionGuard>
        } />

        <Route path="/locations" element={
          <PermissionGuard permission="branches.view"><BranchesPage /></PermissionGuard>
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
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
