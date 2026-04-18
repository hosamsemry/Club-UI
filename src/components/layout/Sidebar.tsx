import { NavLink, useMatch } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  ArrowLeftRight,
  CalendarRange,
  Ticket,
  TicketCheck,
  Layers,
  CalendarDays,
  BarChart3,
  ClipboardList,
  ShoppingBag,
  ShoppingCart,
  Users,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAppSelector } from '@/app/hooks';
import { can } from '@/utils/roles';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  permission?: Parameters<typeof can>[1];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', permission: 'dashboard' }],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Products', icon: Package, to: '/products', permission: 'products' },
      { label: 'Categories', icon: Tag, to: '/products/categories', permission: 'categories' },
      { label: 'Stock Movements', icon: ArrowLeftRight, to: '/products/stock-movements', permission: 'stock_movements' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'New Sale', icon: Package, to: '/products/sell', permission: 'sales' },
      { label: 'Sales Overview', icon: ShoppingCart, to: '/sales', permission: 'sales' },
      { label: 'Transactions', icon: ShoppingBag, to: '/transactions', permission: 'transactions' },
    ],
  },
  {
    label: 'Events',
    items: [
      { label: 'Reservations', icon: CalendarRange, to: '/reservations', permission: 'reservations' },
    ],
  },
  {
    label: 'Gate Tickets',
    items: [
      { label: 'Entry Days', icon: CalendarDays, to: '/tickets/days', permission: 'entry_days' },
      { label: 'Sell Tickets', icon: Ticket, to: '/tickets/sell', permission: 'ticket_sales' },
      { label: 'Check In', icon: TicketCheck, to: '/tickets/check-in', permission: 'ticket_checkin' },
      { label: 'Ticket List', icon: Layers, to: '/tickets', permission: 'ticket_list' },
      { label: 'Ticket Types', icon: Tag, to: '/tickets/types', permission: 'ticket_types' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Reports', icon: BarChart3, to: '/reports', permission: 'reports' },
      { label: 'Audit Logs', icon: ClipboardList, to: '/audit', permission: 'audit' },
      { label: 'Staff', icon: Users, to: '/users', permission: 'users_management' },
    ],
  },
];

function NavButton({ item }: { item: NavItem }) {
  const match = useMatch(item.to);
  return (
    <SidebarMenuButton
      render={<NavLink to={item.to} />}
      isActive={!!match}
      tooltip={item.label}
    >
      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span>{item.label}</span>
    </SidebarMenuButton>
  );
}

export function AppSidebar() {
  const role = useAppSelector((s) => s.auth.role) as UserRole | null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
          <a href="/dashboard">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg  flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 hover:scale-105">
           <img src="logo.png" alt="Logo"  height={70} style={{maxWidth:"70px"}} />
          </div>
            <span className="font-semibold text-sidebar-accent-foreground text-sm truncate group-data-[collapsible=icon]:hidden">
              Club Management
            </span>
          
        </div>
          </a>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || can(role, item.permission),
          );
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-[0.65rem] font-semibold uppercase tracking-[0.15em] px-3 mb-1">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.to} className="group">
                      <NavButton item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border" />
    </Sidebar>
  );
}
