import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen relative overflow-hidden">
        {/* Nightlife ambient backdrop glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-0 dark:opacity-100 transition-opacity duration-1000"
        >
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-600/10 blur-[128px]" />
          <div className="absolute top-1/4 -right-32 h-[32rem] w-[32rem] rounded-full bg-cyan-500/8 blur-[140px]" />
          <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-purple-700/10 blur-[130px]" />
        </div>

        <Header />
        <main className="flex-1 overflow-auto bg-transparent p-6 lg:p-8">
          <div
            key={location.pathname}
            className="animate-fade-in-up"
            style={{ animationDuration: '0.35s' }}
          >
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
