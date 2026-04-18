import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ElementType } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  DollarSign,
  Package2,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useAppSelector } from '@/app/hooks';
import {
  useGetDailyProfitQuery,
  useGetDailySummaryQuery,
  useGetTopProductsQuery,
} from '@/api/apiSlice';
import { formatCurrency, formatDate } from '@/utils/format';
import { RevenueCalculator } from '../reports/RevenueCalculator';

const today = new Date().toISOString().slice(0, 10);

function parseAmount(value?: string | number) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
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

export function SalesPage() {
  const role = useAppSelector((state) => state.auth.role);
  const canViewManagementInsights = role === 'owner' || role === 'manager';
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(today);

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

  const summaryRevenue = parseAmount(summaryData?.total_revenue);
  const summaryCount = summaryData?.sales_count ?? 0;
  const averageSaleValue = summaryCount > 0 ? summaryRevenue / summaryCount : 0;
  const profitValue = parseAmount(profitData?.total_profit ?? profitData?.profit);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sales Overview"
        description="Track product-sales performance, daily revenue, and quick business statistics from one place."
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-none lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Overview</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Daily sales snapshot</h2>
            <p className="text-sm text-muted-foreground">
              Choose a day to refresh revenue, profit, and product-performance insights.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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

            {canViewManagementInsights && (
              <Button type="button" onClick={() => navigate('/transactions')}>
                <ShoppingBag className="mr-2 h-4 w-4" /> Open Transactions History
              </Button>
            )}
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
              icon={BarChart3}
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

      <section>
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              The detailed sales history has been moved into the new transactions page.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 md:grid-cols-3">
            {canViewManagementInsights && (
              <Button type="button" variant="outline" onClick={() => navigate('/transactions')}>
                <ShoppingBag className="mr-2 h-4 w-4" /> View Transactions
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => navigate('/products/sell')}>
              <DollarSign className="mr-2 h-4 w-4" /> Create New Sale
            </Button>
            {canViewManagementInsights && (
              <Button type="button" variant="outline" onClick={() => navigate('/reports')}>
                <ArrowRight className="mr-2 h-4 w-4" /> Open Reports
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
