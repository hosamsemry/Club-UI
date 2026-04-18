import { useDeferredValue, useMemo, useState } from 'react';
import {
  CalendarDays,
  Download,
  Filter,
  MoreHorizontal,
  ReceiptText,
  RotateCcw,
  Search,
  Wallet,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { API_BASE_URL, useGetTransactionsQuery, useRefundSaleMutation } from '@/api/apiSlice';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { TransactionRow } from '@/types';
import { getAccessToken } from '@/utils/auth';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

const PAGE_SIZE = 20;
const today = new Date().toISOString().slice(0, 10);

const refundSchema = z.object({ note: z.string().min(1, 'Note is required') });
type RefundFormValues = z.infer<typeof refundSchema>;

type RefundTarget = {
  id: number;
  total_amount: string;
  reference: string;
} | null;

function parseAmount(value?: string | number) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function SourceBadge({ source }: { source: TransactionRow['source'] }) {
  const config: Record<TransactionRow['source'], string> = {
    products: 'bg-blue-50 text-blue-700 border-blue-200/60',
    tickets: 'bg-violet-50 text-violet-700 border-violet-200/60',
    events: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  };

  return (
    <Badge variant="outline" className={`font-medium capitalize ${config[source]}`}>
      {source}
    </Badge>
  );
}

function RefundDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: RefundTarget;
}) {
  const [refundSale, { isLoading, error }] = useRefundSaleMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
  });

  async function onSubmit(values: RefundFormValues) {
    if (!target) return;
    try {
      await refundSale({ id: target.id, note: values.note }).unwrap();
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
          <DialogTitle>Refund Product Sale</DialogTitle>
          <DialogDescription>
            Refund {target?.reference} for {formatCurrency(target?.total_amount ?? '0')}.
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

export function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput.trim());
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [ordering, setOrdering] = useState('-activity_at');
  const [refundTarget, setRefundTarget] = useState<RefundTarget>(null);

  const params = useMemo(() => {
    const nextParams: Record<string, string> = {
      page: String(page),
      start_date: startDate,
      end_date: endDate,
      ordering,
    };
    if (deferredSearch) nextParams.search = deferredSearch;
    if (sourceFilter !== 'all') nextParams.source = sourceFilter;
    if (statusFilter !== 'all') nextParams.status = statusFilter;
    return nextParams;
  }, [page, startDate, endDate, ordering, deferredSearch, sourceFilter, statusFilter]);

  const { data, isLoading, error } = useGetTransactionsQuery(params);
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
  const activeFilterCount = [deferredSearch, sourceFilter !== 'all' ? sourceFilter : '', statusFilter !== 'all' ? statusFilter : '', startDate, endDate].filter(Boolean).length;

  const pageNetTotal = useMemo(
    () => (data?.results ?? []).reduce((sum, row) => sum + parseAmount(row.net_amount), 0),
    [data],
  );
  const pageRefundTotal = useMemo(
    () => (data?.results ?? []).reduce((sum, row) => sum + parseAmount(row.refund_amount), 0),
    [data],
  );

  function clearFilters() {
    setSearchInput('');
    setSourceFilter('all');
    setStatusFilter('all');
    setStartDate(today);
    setEndDate(today);
    setOrdering('-activity_at');
    setPage(1);
  }

  function getEmptyMessage() {
    if ((data?.count ?? 0) > 0) return 'No transactions on this page.';
    if (startDate && endDate && startDate === endDate) {
      return `No transactions found for ${formatDate(startDate)}.`;
    }
    return 'No transactions match your current filters.';
  }

  function handleExport() {
    const token = getAccessToken();
    if (!token) {
      toast.error('You need to be logged in to export');
      return;
    }

    const query = new URLSearchParams();
    query.set('start_date', startDate);
    query.set('end_date', endDate);
    query.set('ordering', ordering);
    if (deferredSearch) query.set('search', deferredSearch);
    if (sourceFilter !== 'all') query.set('source', sourceFilter);
    if (statusFilter !== 'all') query.set('status', statusFilter);

    const url = `${API_BASE_URL}/api/reporting/transactions/export/csv/?${query.toString()}`;
    void fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = `transactions-${startDate}-to-${endDate}.csv`;
        anchor.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error('Failed to export transactions'));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions History"
        description="Review all product, ticket, and event transactions in one timeline and export them to CSV."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Matched Rows</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{data?.count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Transactions in the selected range</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Page Net Value</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{formatCurrency(pageNetTotal)}</p>
                <p className="text-xs text-muted-foreground">Current page total after refunds</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Refunds On Page</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{formatCurrency(pageRefundTotal)}</p>
                <p className="text-xs text-muted-foreground">Refund activity in the visible results</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <RotateCcw className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle>Transactions Table</CardTitle>
            <CardDescription>
              Filter by date, source, or status and export the current range as an Excel-friendly CSV.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_0.8fr_0.8fr_0.8fr_0.8fr_0.85fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="transactions-search" className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="transactions-search"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Reference, customer, phone, or cashier"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Source</Label>
                <Select value={sourceFilter} onValueChange={(value) => {
                  setSourceFilter(value ?? 'all');
                  setPage(1);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="tickets">Tickets</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value ?? 'all');
                  setPage(1);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="voided">Voided</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transactions-start-date" className="text-xs">Start Date</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="transactions-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transactions-end-date" className="text-xs">End Date</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="transactions-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Sort By</Label>
                <Select value={ordering} onValueChange={(value) => {
                  setOrdering(value ?? '-activity_at');
                  setPage(1);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-activity_at">Newest first</SelectItem>
                    <SelectItem value="activity_at">Oldest first</SelectItem>
                    <SelectItem value="-net_amount">Highest value</SelectItem>
                    <SelectItem value="net_amount">Lowest value</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button type="button" variant="outline" onClick={clearFilters} className="flex-1 xl:flex-none">
                  <Filter className="mr-2 h-4 w-4" /> Clear
                </Button>
                <Button type="button" onClick={handleExport} className="flex-1 xl:flex-none">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </div>

            {error && <ErrorDisplay error={error} />}

            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Reference</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Date</TableHead>
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
                      <TableCell colSpan={8} className="py-14 text-center">
                        <div className="space-y-2">
                          <p className="font-medium">{getEmptyMessage()}</p>
                          <p className="text-sm text-muted-foreground">
                            {activeFilterCount > 0
                              ? 'Try widening the date range or clearing some filters.'
                              : 'Transactions will appear here once sales, tickets, or event payments are recorded.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.results.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm font-medium">{row.reference}</p>
                            <p className="text-xs text-muted-foreground">#{row.transaction_id}</p>
                          </div>
                        </TableCell>
                        <TableCell><SourceBadge source={row.source} /></TableCell>
                        <TableCell>
                          <div className="max-w-44">
                            <p className="truncate font-medium">{row.customer_name || 'Walk-in / Internal'}</p>
                            <p className="truncate text-xs text-muted-foreground">{row.customer_phone || row.created_by_email || '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-72 text-sm text-muted-foreground">{row.summary}</TableCell>
                        <TableCell><StatusBadge status={row.status} /></TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(row.net_amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(row.activity_at)}</TableCell>
                        <TableCell>
                          {row.source === 'products' && row.status === 'completed' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setRefundTarget({
                                    id: row.transaction_id,
                                    total_amount: row.gross_amount,
                                    reference: row.reference,
                                  })}
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
                {data?.count ?? 0} transactions found
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

      <RefundDialog
        open={!!refundTarget}
        onOpenChange={(open) => {
          if (!open) setRefundTarget(null);
        }}
        target={refundTarget}
      />
    </div>
  );
}
