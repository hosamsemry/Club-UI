import type { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  staff: 'Staff',
};

type Permission =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'stock_movements'
  | 'reservations'
  | 'ticket_types'
  | 'entry_days'
  | 'ticket_sales'
  | 'ticket_checkin'
  | 'ticket_list'
  | 'reports'
  | 'audit'
  | 'sales'
  | 'transactions'
  | 'users_management';

const PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'dashboard',
    'products',
    'categories',
    'stock_movements',
    'reservations',
    'ticket_types',
    'entry_days',
    'ticket_sales',
    'ticket_checkin',
    'ticket_list',
    'reports',
    'audit',
    'sales',
    'transactions',
    'users_management',
  ],
  manager: [
    'dashboard',
    'products',
    'categories',
    'stock_movements',
    'reservations',
    'ticket_types',
    'entry_days',
    'ticket_sales',
    'ticket_checkin',
    'ticket_list',
    'reports',
    'audit',
    'sales',
    'transactions',
    'users_management',
  ],
  cashier: [
    'products',
    'stock_movements',
    'ticket_sales',
    'ticket_checkin',
    'ticket_list',
    'sales',
  ],
  staff: ['ticket_checkin', 'ticket_list'],
};

export function can(role: UserRole | null, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[role].includes(permission);
}

export function getDefaultRoute(role: UserRole | null): string {
  if (!role) return '/login';
  if (role === 'owner' || role === 'manager') return '/dashboard';
  if (role === 'cashier') return '/products';
  return '/tickets/check-in';
}
