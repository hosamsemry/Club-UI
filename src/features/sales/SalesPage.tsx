import { useState } from 'react';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useAppSelector } from '@/app/hooks';
import { useGetSalesQuery, useRefundSaleMutation } from '@/api/apiSlice';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Sale } from '@/types';
import { toast } from 'sonner';
import { RevenueCalculator } from '../reports/RevenueCalculator';

const refundSchema = z.object({ note: z.string().min(1, 'Note is required') });
type RefundFormValues = z.infer<typeof refundSchema>;

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
    } catch { /* shown */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Refund Sale</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Refund sale for <strong>{formatCurrency(sale?.total_amount ?? '0')}</strong>?
        </p>
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

export function SalesPage() {
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<Sale | null>(null);
  const role = useAppSelector((state) => state.auth.role);
  const { data, isLoading, error } = useGetSalesQuery({ page: String(page) });
  const totalPages = data ? Math.ceil(data.count / 20) : 1;
  const canViewRevenueCalculator = role === 'owner' || role === 'manager';

  return (
    <div>
      <PageHeader title="Sales" description="Product sales history" />

      {error && <ErrorDisplay error={error} />}

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-none animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>ID</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No sales found</TableCell>
              </TableRow>
            ) : (
              data?.results.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-muted-foreground font-mono text-sm">#{sale.id}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(sale.total_amount)}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-xs">{sale.note || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDateTime(sale.created_at)}</TableCell>
                  <TableCell>
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
                          <RotateCcw className="h-4 w-4 mr-2" /> Refund
                        </DropdownMenuItem>
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
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} total sales</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} /></PaginationItem>
              <PaginationItem><span className="text-sm px-3 py-2">Page {page} of {totalPages}</span></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      {canViewRevenueCalculator && (
        <div className="my-6">
          <RevenueCalculator />
        </div>
      )}
      <RefundDialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)} sale={refundTarget} />
    </div>
  );
}
