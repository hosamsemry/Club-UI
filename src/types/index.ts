// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'owner' | 'manager' | 'cashier' | 'staff';

export interface RegisterPayload {
  club_name: string;
  email: string;
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthState {
  access: string | null;
  refresh: string | null;
  role: UserRole | null;
  email: string | null;
  isAuthenticated: boolean;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface ActivityItem {
  action: string;
  user_email: string;
  created_at: string;
}

export interface DashboardSummary {
  total_products: number;
  low_stock_alert_count: number;
  today_reservations_count: number;
  pending_reservations_count: number;
  today_ticket_sales_count: number;
  today_ticket_revenue: string;
  today_checked_in_tickets_count: number;
  recent_activity: ActivityItem[];
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  category: number;
  category_name?: string;
  sku: string;
  cost_price: string;
  selling_price: string;
  stock_quantity: number;
  is_active: boolean;
  low_stock_threshold: number;
  total_sold_30d: number;
  is_best_seller: boolean;
}

export type MovementType = 'restock' | 'sale' | 'adjustment' | 'refund';
export type MovementDirection = 'in' | 'out';

export interface StockMovement {
  id: number;
  product: number;
  product_name?: string;
  movement_type: MovementType;
  quantity: number;
  direction?: MovementDirection;
  note: string;
  created_at: string;
}

export interface LowStockAlert {
  id: number;
  product: number;
  product_name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
}

// ─── Events / Reservations ───────────────────────────────────────────────────
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface OccasionType {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Reservation {
  id: number;
  occasion_type: number;
  occasion_type_name?: string;
  guest_name: string;
  guest_phone: string;
  starts_at: string;
  ends_at: string;
  guest_count: number;
  total_amount: string;
  paid_amount?: string;
  status: ReservationStatus;
  notes: string;
}

// ─── Gate Tickets ─────────────────────────────────────────────────────────────
export type TicketStatus = 'valid' | 'checked_in' | 'voided';

export interface TicketType {
  id: number;
  name: string;
  price: string;
  is_active: boolean;
  display_order: number;
}

export interface EntryDay {
  id: number;
  visit_date: string;
  daily_capacity: number;
  is_open: boolean;
}

export interface TicketSaleItem {
  ticket_type: number;
  quantity: number;
}

export interface TicketSale {
  id: number;
  buyer_name: string;
  buyer_phone: string;
  visit_date: string;
  notes: string;
  total_amount: string;
  items: TicketSaleItem[];
  created_at: string;
}

export interface Ticket {
  id: number;
  sale: number;
  ticket_type: number;
  ticket_type_name?: string;
  code: string;
  status: TicketStatus;
  visit_date: string;
  checked_in_at?: string;
}

// ─── Sales ───────────────────────────────────────────────────────────────────
export interface SaleItem {
  id?: number;
  product?: number;
  product_id?: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: string;
  subtotal?: string;
}

export interface Sale {
  id: number;
  status: string;
  total_amount: string;
  created_at: string;
  created_by_email?: string;
  items: SaleItem[];
}

export interface DailySummary {
  date: string;
  total_sales?: string;
  total_items?: number;
  total_revenue?: string;
  sales_count?: number;
  by_cashier?: {
    created_by_id: number;
    created_by__email: string;
    revenue: string;
    count: number;
  }[];
}

export interface DailyProfit {
  date: string;
  revenue?: string;
  cost?: string;
  profit?: string;
  total_revenue?: string;
  total_cost?: string;
  total_profit?: string;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  product_sku?: string;
  total_quantity?: number;
  total_quantity_sold?: number;
  total_revenue: string;
}

export interface TopProductsResponse {
  date: string;
  results: TopProduct[];
}

// ─── Reporting ───────────────────────────────────────────────────────────────
export interface DailyReport {
  id: number;
  report_date: string;
  csv_file?: string | null;
  total_sales?: string;
  total_tickets?: number;
  total_revenue?: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: number;
  action: string;
  user_email: string;
  created_at: string;
}

// ─── Club Users ───────────────────────────────────────────────────────────────
export interface ClubUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
}

// ─── Revenue ─────────────────────────────────────────────────────────────────
export type RevenueField = 'tickets' | 'products' | 'events';

export interface RevenueReport {
  start_date: string;
  end_date: string;
  tickets?: string;
  products?: string;
  events?: string;
  total_revenue: string;
}

// ─── API Error ───────────────────────────────────────────────────────────────
export interface ApiError {
  status: number;
  data: Record<string, string | string[]> | { detail: string };
}
