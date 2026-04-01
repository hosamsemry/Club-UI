import { useDeferredValue, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import {
  ArrowDownUp,
  CalendarDays,
  DollarSign,
  MoreHorizontal,
  Package2,
  RotateCcw,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAppSelector } from '@/app/hooks';
import {
  useGetDailyProfitQuery,
  useGetDailySummaryQuery,
  useGetSalesQuery,
  useGetTopProductsQuery,
  useRefundSaleMutation,
} from '@/api/apiSlice';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import type { Sale } from '@/types';
import { toast } from 'sonner';
import { RevenueCalculator } from '../reports/RevenueCalculator';

const PAGE_SIZE = 20;
const today = new Date().toISOString().slice(0, 10);

const refundSchema = z.object({ note: z.string().min(1, 'Note is required') });
type RefundFormValues = z.infer<typeof refundSchema>;

function parseAmount(value?: string | number) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getSaleItemCount(sale: Sale) {
  return sale.items.reduce((sum, item) => sum + item.quantity, 0);
}

function SalesStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  isLoading,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ElementType;
  tone: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="border border-border/60 shadow-none">
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RefundDialog({ open, onOpenChange, sale }: { open: boolean; onOpenChange: (o: boolean) => void; sale: Sale | null }) {
  const [refundSale, { isLoading, error }] = useRefundSaleMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
  });

  async function onSubmit(values: RefundFormValues) {
    if (!sale) return;
    try {
      await refundSale({ id: sale.id, note: values.note }).unwrap();
      toast.success('Sale refunded');
      reset();
      onOpenChange(false);
    } catch {
      // handled by ErrorDisplay
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Refund Sale</DialogTitle>
          <DialogDescription>
            Refund sale #{sale?.id} for {formatCurrency(sale?.total_amount ?? '0')}.
          </DialogDescription>
        </DialogHeader>
        {error && <ErrorDisplay error={error} />}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="refund-note">Reason *</Label>
            <Textarea id="refund-note" {...register('note')} rows={2} placeholder="Reason for refund" />
            {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? 'Refunding…' : 'Refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SaleDetailsDialog({
  sale,
  open,
  onOpenChange,
}: {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sale #{sale?.id}</DialogTitle>
          <DialogDescription>
            Review the items, cashier, and total for this sale.
          </DialogDescription>
        </DialogHeader>

        {sale && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <Card size="sm" className="border border-border/60 shadow-none">
                <CardContent className="space-y-1 p-3">
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                  <StatusBadge status={sale.status} />
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/60 shadow-none">
                <CardContent className="space-y-1 p-3">
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">Cashier</p>
                  <p className="font-medium">{sale.created_by_email ?? '—'}</p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/60 shadow-none">
                <CardContent className="space-y-1 p-3">
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(sale.created_at)}</p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/60 shadow-none">
                <CardContent className="space-y-1 p-3">
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">Total</p>
                  <p className="font-semibold text-primary">{formatCurrency(sale.total_amount)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No sale items available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sale.items.map((item) => (
                      <TableRow key={item.id ?? `${item.product_name}-${item.product_sku}-${item.quantity}`}>
                        <TableCell className="font-medium">{item.product_name ?? 'Product'}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{item.product_sku ?? '—'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.subtotal ?? 0)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SalesPage() {
  const role = useAppSelector((state) => state.auth.role);
  const canViewManagementInsights = role === 'owner' || role === 'manager';
  const canRefundSales = canViewManagementInsights;

  const [page, setPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput.trim());
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [ordering, setOrdering] = useState('-created_at');
  const [refundTarget, setRefundTarget] = useState<Sale | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Sale | null>(null);

  const salesParams = useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
      ordering,
    };
    if (deferredSearch) params.search = deferredSearch;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return params;
  }, [page, ordering, deferredSearch, statusFilter, startDate, endDate]);

  const { data, isLoading, error } = useGetSalesQuery(salesParams);
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useGetDailySummaryQuery({ date: selectedDate });
  const {
    data: profitData,
    isLoading: isProfitLoading,
    error: profitError,
  } = useGetDailyProfitQuery(
    { date: selectedDate },
    { skip: !canViewManagementInsights },
  );
  const {
    data: topProductsData,
    isLoading: isTopProductsLoading,
    error: topProductsError,
  } = useGetTopProductsQuery(
    { date: selectedDate },
    { skip: !canViewManagementInsights },
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
  const summaryRevenue = parseAmount(summaryData?.total_revenue);
  const summaryCount = summaryData?.sales_count ?? 0;
  const averageSaleValue = summaryCount > 0 ? summaryRevenue / summaryCount : 0;
  const profitValue = parseAmount(profitData?.total_profit ?? profitData?.profit);
  const activeFilterCount = [
    deferredSearch,
    statusFilter !== 'all' ? statusFilter : '',
    startDate,
    endDate,
  ].filter(Boolean).length;

  function clearFilters() {
    setSearchInput('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setOrdering('-created_at');
    setPage(1);
  }

  function getEmptyMessage() {
    if (activeFilterCount === 0) return 'No sales have been recorded yet.';
    if (startDate && endDate && startDate === endDate) {
      return `No sales found for ${formatDate(startDate)}.`;
    }
    return 'No sales match your current filters.';
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Sales" description="Review product sales, daily performance, and item-level details." />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-none sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Overview</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Daily sales snapshot</h2>
            <p className="text-sm text-muted-foreground">Choose a day to refresh revenue and performance insights.</p>
          </div>
          <div className="w-full sm:w-auto">
            <Label htmlFor="sales-overview-date" className="text-xs">Snapshot Date</Label>
            <div className="relative mt-1">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="sales-overview-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 sm:w-44"
              />
            </div>
          </div>
        </div>

        {(summaryError || (canViewManagementInsights && profitError)) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {summaryError && <ErrorDisplay error={summaryError} />}
            {canViewManagementInsights && profitError && <ErrorDisplay error={profitError} />}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SalesStatCard
            title="Sales Revenue"
            value={formatCurrency(summaryRevenue)}
            subtitle={`Completed sales on ${formatDate(selectedDate)}`}
            icon={DollarSign}
            tone="bg-green-50 text-green-700"
            isLoading={isSummaryLoading}
          />
          <SalesStatCard
            title="Completed Sales"
            value={String(summaryCount)}
            subtitle="Successful product checkouts"
            icon={Wallet}
            tone="bg-blue-50 text-blue-700"
            isLoading={isSummaryLoading}
          />
          <SalesStatCard
            title="Average Sale"
            value={formatCurrency(averageSaleValue)}
            subtitle="Average basket value"
            icon={TrendingUp}
            tone="bg-amber-50 text-amber-700"
            isLoading={isSummaryLoading}
          />
          {canViewManagementInsights && (
            <SalesStatCard
              title="Estimated Profit"
              value={formatCurrency(profitValue)}
              subtitle="Manager-only margin snapshot"
              icon={ArrowDownUp}
              tone="bg-violet-50 text-violet-700"
              isLoading={isProfitLoading}
            />
          )}
        </div>
      </section>

      {canViewManagementInsights && (
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border border-border/60 shadow-none">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-4 w-4 text-primary" />
                Top Products
              </CardTitle>
              <CardDescription>
                Best-performing products for {formatDate(selectedDate)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {topProductsError ? (
                <div className="p-4">
                  <ErrorDisplay error={topProductsError} />
                </div>
              ) : isTopProductsLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between gap-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="ml-auto h-4 w-16" />
                        <Skeleton className="ml-auto h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topProductsData?.results.length ? (
                <div className="divide-y divide-border/50">
                  {topProductsData.results.slice(0, 5).map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">{product.product_sku ?? 'No SKU'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.total_revenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          {(product.total_quantity_sold ?? product.total_quantity ?? 0)} items sold
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-52 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  No product sales to highlight for this day yet.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {summaryData?.by_cashier && summaryData.by_cashier.length > 0 && (
              <Card className="border border-border/60 shadow-none">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="text-base">Cashier Breakdown</CardTitle>
                  <CardDescription>Who contributed the most revenue today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {summaryData.by_cashier.slice(0, 3).map((cashier) => (
                    <div key={cashier.created_by_id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{cashier.created_by__email}</p>
                        <p className="text-xs text-muted-foreground">{cashier.count} sales</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(cashier.revenue)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <RevenueCalculator />
          </div>
        </section>
      )}

      <section className="space-y-4">
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle>Sales History</CardTitle>
            <CardDescription>
              Search by product, SKU, or cashier and drill into each sale.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_0.8fr_0.8fr_0.8fr_0.9fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="sales-search" className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sales-search"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Product, SKU, or cashier email"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sales-start-date" className="text-xs">Start Date</Label>
                <Input
                  id="sales-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sales-end-date" className="text-xs">End Date</Label>
                <Input
                  id="sales-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Sort By</Label>
                <Select value={ordering} onValueChange={(value) => {
                  setOrdering(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-created_at">Newest first</SelectItem>
                    <SelectItem value="created_at">Oldest first</SelectItem>
                    <SelectItem value="-total_amount">Highest total</SelectItem>
                    <SelectItem value="total_amount">Lowest total</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={clearFilters} className="w-full lg:w-auto">
                  Clear Filters
                </Button>
              </div>
            </div>

            {error && <ErrorDisplay error={error} />}

            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Sale</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : data?.results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center">
                        <div className="space-y-2">
                          <p className="font-medium">{getEmptyMessage()}</p>
                          <p className="text-sm text-muted-foreground">
                            {activeFilterCount > 0
                              ? 'Try clearing filters or widening the date range.'
                              : 'Once a sale is created, it will appear here.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.results.map((sale) => (
                      <TableRow
                        key={sale.id}
                        className="cursor-pointer transition-colors hover:bg-muted/25"
                        onClick={() => setDetailsTarget(sale)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm font-medium">#{sale.id}</p>
                            <p className="text-xs text-muted-foreground">Tap for item details</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={sale.status} />
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                          {sale.created_by_email ?? '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">{getSaleItemCount(sale)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(sale.total_amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(sale.created_at)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {canRefundSales && sale.status === 'completed' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setRefundTarget(sale)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" /> Refund
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {data?.count ?? 0} sales found
                {activeFilterCount > 0 ? ` with ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}` : ''}
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setPage((current) => Math.max(1, current - 1))} />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-3 py-2 text-sm">Page {page} of {totalPages}</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext onClick={() => setPage((current) => Math.min(totalPages, current + 1))} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <SaleDetailsDialog
        sale={detailsTarget}
        open={!!detailsTarget}
        onOpenChange={(open) => !open && setDetailsTarget(null)}
      />
      <RefundDialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)} sale={refundTarget} />
    </div>
  );
}
