import {
  Package,
  AlertTriangle,
  CalendarRange,
  Clock,
  Ticket,
  DollarSign,
  TicketCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useGetDashboardQuery } from '@/api/apiSlice';
import { formatCurrency, formatDateTime, formatAction } from '@/utils/format';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  iconBg: string;
}

function StatCard({ title, value, icon: Icon, color, iconBg }: StatCardProps) {
  return (
    <Card className="border shadow-xs hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold mt-1.5 ${color}`}>{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, error } = useGetDashboardQuery();

  return (
    <div>
      <PageHeader title="Dashboard" description="Today's club overview" />

      {error && <ErrorDisplay error={error} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard
              title="Total Products"
              value={data.total_products}
              icon={Package}
              color="text-blue-700"
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Low Stock Alerts"
              value={data.low_stock_alert_count}
              icon={AlertTriangle}
              color={data.low_stock_alert_count > 0 ? 'text-amber-600' : 'text-foreground'}
              iconBg="bg-amber-50 text-amber-600"
            />
            <StatCard
              title="Reservations Today"
              value={data.today_reservations_count}
              icon={CalendarRange}
              color="text-purple-700"
              iconBg="bg-purple-50 text-purple-600"
            />
            <StatCard
              title="Pending Reservations"
              value={data.pending_reservations_count}
              icon={Clock}
              color={data.pending_reservations_count > 0 ? 'text-orange-600' : 'text-foreground'}
              iconBg="bg-orange-50 text-orange-600"
            />
            <StatCard
              title="Tickets Sold Today"
              value={data.today_ticket_sales_count}
              icon={Ticket}
              color="text-teal-700"
              iconBg="bg-teal-50 text-teal-600"
            />
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(data.today_ticket_revenue)}
              icon={DollarSign}
              color="text-green-700"
              iconBg="bg-green-50 text-green-600"
            />
            <StatCard
              title="Check-ins Today"
              value={data.today_checked_in_tickets_count}
              icon={TicketCheck}
              color="text-cyan-700"
              iconBg="bg-cyan-50 text-cyan-600"
            />
          </>
        ) : null}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.recent_activity && data.recent_activity.length > 0 ? (
              <div className="divide-y divide-border">
                {data.recent_activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-semibold">
                        {item.user_email.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {formatAction(item.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.user_email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No recent activity
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
