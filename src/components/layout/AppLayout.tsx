import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
