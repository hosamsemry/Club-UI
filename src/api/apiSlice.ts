import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type {
  PaginatedResponse,
  DashboardSummary,
  AuditLog,
  ClubUser,
  Category,
  Product,
  StockMovement,
  LowStockAlert,
  OccasionType,
  Reservation,
  TicketType,
  EntryDay,
  TicketSale,
  Ticket,
  Sale,
  DailySummary,
  DailyProfit,
  TopProductsResponse,
  DailyReport,
  RevenueReport,
  RegisterPayload,
  AuthTokens,
} from '@/types';
import { getAccessToken, getRefreshToken, setAccessToken } from '@/utils/auth';
import { logout, tokenUpdated } from '@/features/auth/authSlice';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        { url: '/api/token/refresh/', method: 'POST', body: { refresh: refreshToken } },
        api,
        extraOptions,
      );
      if (refreshResult.data) {
        const { access } = refreshResult.data as { access: string };
        setAccessToken(access);
        api.dispatch(tokenUpdated({ access }));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Dashboard',
    'AuditLogs',
    'Categories',
    'Products',
    'StockMovements',
    'LowStockAlerts',
    'OccasionTypes',
    'Reservations',
    'TicketTypes',
    'EntryDays',
    'TicketSales',
    'Tickets',
    'Sales',
    'Reports',    'ClubUsers',  ],
  endpoints: (builder) => ({    // ─── Auth (public) ─────────────────────────────────────────────────
    registerClub: builder.mutation<AuthTokens, RegisterPayload>({
      query: (body) => ({ url: '/api/accounts/register/', method: 'POST', body }),
    }),
    // ─── Core ─────────────────────────────────────────────────────────────
    getDashboard: builder.query<DashboardSummary, void>({
      query: () => '/api/core/dashboard/',
      providesTags: ['Dashboard'],
    }),
    getAuditLogs: builder.query<PaginatedResponse<AuditLog>, Record<string, string>>({
      query: (params) => ({ url: '/api/core/audit-logs/', params }),
      providesTags: ['AuditLogs'],
    }),

    // ─── Club Users ───────────────────────────────────────────────────────
    getClubUsers: builder.query<PaginatedResponse<ClubUser>, Record<string, string>>({
      query: (params) => ({ url: '/api/accounts/users/', params }),
      providesTags: ['ClubUsers'],
    }),
    createClubUser: builder.mutation<ClubUser, { email: string; username: string; password: string; role: string }>({
      query: (body) => ({ url: '/api/accounts/users/', method: 'POST', body }),
      invalidatesTags: ['ClubUsers'],
    }),
    updateClubUser: builder.mutation<ClubUser, { id: number; role?: string; is_active?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/api/accounts/users/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['ClubUsers'],
    }),

    // ─── Inventory – Categories ────────────────────────────────────────────
    getCategories: builder.query<PaginatedResponse<Category>, Record<string, string>>({
      query: (params) => ({ url: '/api/inventory/categories/', params }),
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (body) => ({ url: '/api/inventory/categories/', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation<Category, { id: number } & Partial<Category>>({
      query: ({ id, ...body }) => ({ url: `/api/inventory/categories/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/inventory/categories/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),

    // ─── Inventory – Products ──────────────────────────────────────────────
    getProducts: builder.query<PaginatedResponse<Product>, Record<string, string>>({
      query: (params) => ({ url: '/api/inventory/products/', params }),
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (body) => ({ url: '/api/inventory/products/', method: 'POST', body }),
      invalidatesTags: ['Products', 'Dashboard'],
    }),
    updateProduct: builder.mutation<Product, { id: number } & Partial<Product>>({
      query: ({ id, ...body }) => ({ url: `/api/inventory/products/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['Products', 'Dashboard'],
    }),
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/inventory/products/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Products', 'Dashboard'],
    }),

    // ─── Inventory – Stock Movements ───────────────────────────────────────
    getStockMovements: builder.query<PaginatedResponse<StockMovement>, Record<string, string>>({
      query: (params) => ({ url: '/api/inventory/stock-movements/', params }),
      providesTags: ['StockMovements'],
    }),
    createStockMovement: builder.mutation<StockMovement, Partial<StockMovement>>({
      query: (body) => ({ url: '/api/inventory/stock-movements/', method: 'POST', body }),
      invalidatesTags: ['StockMovements', 'Products', 'LowStockAlerts', 'Dashboard'],
    }),

    // ─── Inventory – Low Stock Alerts ──────────────────────────────────────
    getLowStockAlerts: builder.query<PaginatedResponse<LowStockAlert>, Record<string, string>>({
      query: (params) => ({ url: '/api/inventory/low-stock-alerts/', params }),
      providesTags: ['LowStockAlerts'],
    }),

    // ─── Events – Occasion Types ───────────────────────────────────────────
    getOccasionTypes: builder.query<PaginatedResponse<OccasionType>, Record<string, string>>({
      query: (params) => ({ url: '/api/events/occasion-types/', params }),
      providesTags: ['OccasionTypes'],
    }),
    createOccasionType: builder.mutation<OccasionType, Partial<OccasionType>>({
      query: (body) => ({ url: '/api/events/occasion-types/', method: 'POST', body }),
      invalidatesTags: ['OccasionTypes'],
    }),
    updateOccasionType: builder.mutation<OccasionType, { id: number } & Partial<OccasionType>>({
      query: ({ id, ...body }) => ({ url: `/api/events/occasion-types/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['OccasionTypes'],
    }),

    // ─── Events – Reservations ─────────────────────────────────────────────
    getReservations: builder.query<PaginatedResponse<Reservation>, Record<string, string>>({
      query: (params) => ({ url: '/api/events/reservations/', params }),
      providesTags: ['Reservations'],
    }),
    createReservation: builder.mutation<Reservation, Partial<Reservation>>({
      query: (body) => ({ url: '/api/events/reservations/', method: 'POST', body }),
      invalidatesTags: ['Reservations', 'Dashboard'],
    }),
    updateReservation: builder.mutation<Reservation, { id: number } & Partial<Reservation>>({
      query: ({ id, ...body }) => ({ url: `/api/events/reservations/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['Reservations'],
    }),
    recordPayment: builder.mutation<Reservation, { id: number; amount: string; note: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/events/reservations/${id}/record-payment/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reservations', 'Dashboard'],
    }),
    cancelReservation: builder.mutation<Reservation, { id: number; refund_amount: string; note: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/events/reservations/${id}/cancel/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reservations', 'Dashboard'],
    }),

    // ─── Tickets – Ticket Types ────────────────────────────────────────────
    getTicketTypes: builder.query<PaginatedResponse<TicketType>, Record<string, string>>({
      query: (params) => ({ url: '/api/tickets/types/', params }),
      providesTags: ['TicketTypes'],
    }),
    createTicketType: builder.mutation<TicketType, Partial<TicketType>>({
      query: (body) => ({ url: '/api/tickets/types/', method: 'POST', body }),
      invalidatesTags: ['TicketTypes'],
    }),
    updateTicketType: builder.mutation<TicketType, { id: number } & Partial<TicketType>>({
      query: ({ id, ...body }) => ({ url: `/api/tickets/types/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['TicketTypes'],
    }),

    // ─── Tickets – Entry Days ──────────────────────────────────────────────
    getEntryDays: builder.query<PaginatedResponse<EntryDay>, Record<string, string>>({
      query: (params) => ({ url: '/api/tickets/days/', params }),
      providesTags: ['EntryDays'],
    }),
    createEntryDay: builder.mutation<EntryDay, Partial<EntryDay>>({
      query: (body) => ({ url: '/api/tickets/days/', method: 'POST', body }),
      invalidatesTags: ['EntryDays'],
    }),
    updateEntryDay: builder.mutation<EntryDay, { id: number } & Partial<EntryDay>>({
      query: ({ id, ...body }) => ({ url: `/api/tickets/days/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['EntryDays'],
    }),

    // ─── Tickets – Sales ───────────────────────────────────────────────────
    getTicketSales: builder.query<PaginatedResponse<TicketSale>, Record<string, string>>({
      query: (params) => ({ url: '/api/tickets/sales/', params }),
      providesTags: ['TicketSales'],
    }),
    createTicketSale: builder.mutation<
      TicketSale,
      { buyer_name: string; buyer_phone: string; visit_date: string; notes: string; items: { ticket_type: number; quantity: number }[] }
    >({
      query: (body) => ({ url: '/api/tickets/sales/', method: 'POST', body }),
      invalidatesTags: ['TicketSales', 'Tickets', 'Dashboard'],
    }),
    getTicketSalesDailySummary: builder.query<DailySummary, { date?: string }>({
      query: (params) => ({ url: '/api/tickets/sales/daily-summary/', params }),
    }),

    // ─── Tickets – Items ───────────────────────────────────────────────────
    getTickets: builder.query<PaginatedResponse<Ticket>, Record<string, string>>({
      query: (params) => ({ url: '/api/tickets/items/', params }),
      providesTags: ['Tickets'],
    }),
    checkInTicket: builder.mutation<Ticket, number>({
      query: (id) => ({ url: `/api/tickets/items/${id}/check-in/`, method: 'POST', body: {} }),
      invalidatesTags: ['Tickets', 'Dashboard'],
    }),
    checkInByCode: builder.mutation<Ticket, { code: string }>({
      query: (body) => ({ url: '/api/tickets/items/check-in-by-code/', method: 'POST', body }),
      invalidatesTags: ['Tickets', 'Dashboard'],
    }),
    voidTicket: builder.mutation<Ticket, { id: number; note: string }>({
      query: ({ id, note }) => ({ url: `/api/tickets/items/${id}/void/`, method: 'POST', body: { note } }),
      invalidatesTags: ['Tickets'],
    }),

    // ─── Sales ────────────────────────────────────────────────────────────
    getSales: builder.query<PaginatedResponse<Sale>, Record<string, string>>({
      query: (params) => ({ url: '/api/sales/', params }),
      providesTags: ['Sales'],
    }),
    createSale: builder.mutation<Sale, { items: { product_id: number; quantity: number; unit_price?: string }[]; note?: string }>({
      query: (body) => ({ url: '/api/sales/', method: 'POST', body }),
      invalidatesTags: ['Sales', 'Products', 'Dashboard'],
    }),
    refundSale: builder.mutation<Sale, { id: number; note: string }>({
      query: ({ id, note }) => ({ url: `/api/sales/${id}/refund/`, method: 'POST', body: { note } }),
      invalidatesTags: ['Sales', 'Products'],
    }),
    getDailySummary: builder.query<DailySummary, { date?: string }>({
      query: (params) => ({ url: '/api/sales/daily-summary/', params }),
    }),
    getDailyProfit: builder.query<DailyProfit, { date?: string }>({
      query: (params) => ({ url: '/api/sales/daily-profit/', params }),
    }),
    getTopProducts: builder.query<TopProductsResponse, { date?: string }>({
      query: (params) => ({ url: '/api/sales/top-products/', params }),
    }),

    // ─── Reporting ────────────────────────────────────────────────────────
    getReports: builder.query<PaginatedResponse<DailyReport>, Record<string, string>>({
      query: (params) => ({ url: '/api/reporting/daily/', params }),
      providesTags: ['Reports'],
    }),
    regenerateReport: builder.mutation<{ detail: string; task_id: string }, number>({
      query: (id) => ({ url: `/api/reporting/daily/${id}/regenerate/`, method: 'POST', body: {} }),
      invalidatesTags: ['Reports'],
    }),

    // ─── Revenue Calculator ─────────────────────────────────────────────
    getRevenue: builder.query<RevenueReport, { start_date: string; end_date: string; fields: string[] }>({
      query: ({ start_date, end_date, fields }) => {
        const params = new URLSearchParams();
        params.set('start_date', start_date);
        params.set('end_date', end_date);
        fields.forEach((f) => params.append('fields', f));
        return { url: `/api/reporting/revenue/?${params.toString()}` };
      },
    }),
  }),
});

export const {
  useRegisterClubMutation,
  useGetDashboardQuery,
  useGetAuditLogsQuery,
  useGetClubUsersQuery,
  useCreateClubUserMutation,
  useUpdateClubUserMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetStockMovementsQuery,
  useCreateStockMovementMutation,
  useGetLowStockAlertsQuery,
  useGetOccasionTypesQuery,
  useCreateOccasionTypeMutation,
  useUpdateOccasionTypeMutation,
  useGetReservationsQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useRecordPaymentMutation,
  useCancelReservationMutation,
  useGetTicketTypesQuery,
  useCreateTicketTypeMutation,
  useUpdateTicketTypeMutation,
  useGetEntryDaysQuery,
  useCreateEntryDayMutation,
  useUpdateEntryDayMutation,
  useGetTicketSalesQuery,
  useCreateTicketSaleMutation,
  useGetTicketSalesDailySummaryQuery,
  useGetTicketsQuery,
  useCheckInTicketMutation,
  useCheckInByCodeMutation,
  useVoidTicketMutation,
  useGetSalesQuery,
  useCreateSaleMutation,
  useRefundSaleMutation,
  useGetDailySummaryQuery,
  useGetDailyProfitQuery,
  useGetTopProductsQuery,
  useGetReportsQuery,
  useRegenerateReportMutation,
  useLazyGetRevenueQuery,
} = apiSlice;

export const API_BASE_URL = BASE_URL;
