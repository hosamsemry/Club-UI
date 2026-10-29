import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { CategoriesPage } from '@/features/products/CategoriesPage';
import { StockMovementsPage } from '@/features/products/StockMovementsPage';
import { ReservationsPage } from '@/features/reservations/ReservationsPage';
import { TicketSalePage } from '@/features/tickets/TicketSalePage';
import { CheckInPage } from '@/features/tickets/CheckInPage';
import { TicketListPage } from '@/features/tickets/TicketListPage';
import { TicketTypesPage } from '@/features/tickets/TicketTypesPage';
import { EntryDaysPage } from '@/features/tickets/EntryDaysPage';
import { SalesPage } from '@/features/sales/SalesPage';
import { TransactionsPage } from '@/features/sales/TransactionsPage';
import { NewSalePage } from '@/features/sales/NewSalePage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AuditPage } from '@/features/audit/AuditPage';
import { UsersPage } from '@/features/users/UsersPage';
import { useAppSelector } from '@/app/hooks';
import { can, getDefaultRoute } from '@/utils/roles';

function ProtectedRoute() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function DefaultRouteRedirect() {
  const role = useAppSelector((s) => s.auth.role);
  return <Navigate to={getDefaultRoute(role)} replace />;
}

function PermissionRoute({ permission, children }: { permission: Parameters<typeof can>[1]; children: React.ReactNode }) {
  const role = useAppSelector((s) => s.auth.role);
  if (!can(role, permission)) {
    return <Navigate to={getDefaultRoute(role)} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DefaultRouteRedirect />} />
              <Route
                path="/dashboard"
                element={
                  <PermissionRoute permission="dashboard">
                    <DashboardPage />
                  </PermissionRoute>
                }
              />

              {/* Products */}
              <Route path="/products" element={<ProductsPage />} />
              <Route
                path="/products/categories"
                element={
                  <PermissionRoute permission="categories">
                    <CategoriesPage />
                  </PermissionRoute>
                }
              />
              <Route path="/products/stock-movements" element={<StockMovementsPage />} />
              <Route path="/products/sell" element={<NewSalePage />} />

              {/* Reservations */}
              <Route
                path="/reservations"
                element={
                  <PermissionRoute permission="reservations">
                    <ReservationsPage />
                  </PermissionRoute>
                }
              />

              {/* Tickets */}
              <Route path="/tickets" element={<TicketListPage />} />
              <Route
                path="/tickets/sell"
                element={
                  <PermissionRoute permission="ticket_sales">
                    <TicketSalePage />
                  </PermissionRoute>
                }
              />
              <Route path="/tickets/check-in" element={<CheckInPage />} />
              <Route
                path="/tickets/types"
                element={
                  <PermissionRoute permission="ticket_types">
                    <TicketTypesPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/tickets/days"
                element={
                  <PermissionRoute permission="entry_days">
                    <EntryDaysPage />
                  </PermissionRoute>
                }
              />

              {/* Sales */}
              <Route
                path="/sales"
                element={
                  <PermissionRoute permission="sales">
                    <SalesPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <PermissionRoute permission="transactions">
                    <TransactionsPage />
                  </PermissionRoute>
                }
              />

              {/* Management */}
              <Route
                path="/reports"
                element={
                  <PermissionRoute permission="reports">
                    <ReportsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <PermissionRoute permission="audit">
                    <AuditPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PermissionRoute permission="users_management">
                    <UsersPage />
                  </PermissionRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<DefaultRouteRedirect />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" toastOptions={{ className: 'animate-slide-in-right' }} />
    </TooltipProvider>
  </ThemeProvider>
);
}
