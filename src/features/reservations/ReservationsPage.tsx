import { useState } from 'react';
import { Plus, MoreHorizontal, Pencil, DollarSign, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ReservationFormSheet } from './ReservationFormSheet';
import { PaymentModal } from './PaymentModal';
import { CancelModal } from './CancelModal';
import { useGetReservationsQuery } from '@/api/apiSlice';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Reservation, ReservationStatus } from '@/types';

const STATUS_OPTIONS: { value: ReservationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

export function ReservationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editReservation, setEditReservation] = useState<Reservation | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Reservation | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const params: Record<string, string> = { page: String(page) };
  if (search) params['search'] = search;
  if (statusFilter !== 'all') params['status'] = statusFilter;

  const { data, isLoading, error } = useGetReservationsQuery(params);
  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  function openCreate() { setEditReservation(null); setFormOpen(true); }
  function openEdit(r: Reservation) { setEditReservation(r); setFormOpen(true); }

  return (
    <div>
      <PageHeader
        title="Event Reservations"
        description="Manage all event and occasion bookings"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Reservation
          </Button>
        }
      />

      {error && <ErrorDisplay error={error} />}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-56"
            placeholder="Search guest name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as ReservationStatus | 'all'); setPage(1); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-none animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Guest</TableHead>
              <TableHead>Occasion</TableHead>
              <TableHead>Starts At</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No reservations found
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-medium">{r.guest_name}</div>
                    <div className="text-xs text-muted-foreground">{r.guest_phone}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.occasion_type_name ?? `#${r.occasion_type}`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(r.starts_at)}
                  </TableCell>
                  <TableCell>{r.guest_count}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(r.total_amount)}</TableCell>
                  <TableCell className="text-right text-green-700 font-medium">
                    {formatCurrency(r.paid_amount ?? '0')}
                  </TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {r.status !== 'cancelled' && (
                          <>
                            <DropdownMenuItem onClick={() => setPaymentTarget(r)}>
                              <DollarSign className="h-4 w-4 mr-2" /> Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setCancelTarget(r)}
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} total reservations</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} /></PaginationItem>
              <PaginationItem><span className="text-sm px-3 py-2">Page {page} of {totalPages}</span></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <ReservationFormSheet open={formOpen} onOpenChange={setFormOpen} reservation={editReservation} />
      <PaymentModal open={!!paymentTarget} onOpenChange={(o) => !o && setPaymentTarget(null)} reservation={paymentTarget} />
      <CancelModal open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)} reservation={cancelTarget} />
    </div>
  );
}
