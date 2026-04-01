import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AuditPage } from '@/features/audit/AuditPage';
import { UsersPage } from '@/features/users/UsersPage';
import { useAppSelector } from '@/app/hooks';

function ProtectedRoute() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Products */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/categories" element={<CategoriesPage />} />
              <Route path="/products/stock-movements" element={<StockMovementsPage />} />

              {/* Reservations */}
              <Route path="/reservations" element={<ReservationsPage />} />

              {/* Tickets */}
              <Route path="/tickets" element={<TicketListPage />} />
              <Route path="/tickets/sell" element={<TicketSalePage />} />
              <Route path="/tickets/check-in" element={<CheckInPage />} />
              <Route path="/tickets/types" element={<TicketTypesPage />} />
              <Route path="/tickets/days" element={<EntryDaysPage />} />

              {/* Sales */}
              <Route path="/sales" element={<SalesPage />} />

              {/* Management */}
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/users" element={<UsersPage />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" toastOptions={{ className: 'animate-slide-in-right' }} />
    </TooltipProvider>
  );
}
