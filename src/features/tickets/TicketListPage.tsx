import { useState } from 'react';
import { Search, MoreHorizontal, TicketCheck, Ban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useGetTicketsQuery, useCheckInTicketMutation, useVoidTicketMutation } from '@/api/apiSlice';
import { formatDate } from '@/utils/format';
import type { Ticket } from '@/types';
import { toast } from 'sonner';

const voidSchema = z.object({ note: z.string().min(1, 'Note is required') });
type VoidFormValues = z.infer<typeof voidSchema>;

function VoidDialog({ open, onOpenChange, ticket }: { open: boolean; onOpenChange: (o: boolean) => void; ticket: Ticket | null }) {
  const [voidTicket, { isLoading, error }] = useVoidTicketMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VoidFormValues>({
    resolver: zodResolver(voidSchema),
  });

  async function onSubmit(values: VoidFormValues) {
    if (!ticket) return;
    try {
      await voidTicket({ id: ticket.id, note: values.note }).unwrap();
      toast.success('Ticket voided');
      reset();
      onOpenChange(false);
    } catch { /* shown via ErrorDisplay */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Void Ticket</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Void ticket <strong className="font-mono">{ticket?.code}</strong>?</p>
        {error && <ErrorDisplay error={error} />}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="void-note">Reason *</Label>
            <Textarea id="void-note" {...register('note')} rows={2} placeholder="Reason for voiding" />
            {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? 'Voiding…' : 'Void Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TicketListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [voidTarget, setVoidTarget] = useState<Ticket | null>(null);

  const params: Record<string, string> = { page: String(page) };
  if (search) params['search'] = search;
  if (statusFilter) params['status'] = statusFilter;

  const { data, isLoading, error } = useGetTicketsQuery(params);
  const [checkIn] = useCheckInTicketMutation();
  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  async function handleCheckIn(id: number) {
    try {
      await checkIn(id).unwrap();
      toast.success('Ticket checked in');
    } catch {
      toast.error('Check-in failed');
    }
  }

  return (
    <div>
      <PageHeader title="Ticket List" description="All issued gate tickets" />

      {error && <ErrorDisplay error={error} />}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-56"
            placeholder="Search by code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Visit Date</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No tickets found</TableCell>
              </TableRow>
            ) : (
              data?.results.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">{ticket.code}</TableCell>
                  <TableCell>{ticket.ticket_type_name ?? `#${ticket.ticket_type}`}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(ticket.visit_date)}</TableCell>
                  <TableCell><StatusBadge status={ticket.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ticket.status === 'valid' && (
                          <>
                            <DropdownMenuItem onClick={() => handleCheckIn(ticket.id)}>
                              <TicketCheck className="h-4 w-4 mr-2" /> Check In
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setVoidTarget(ticket)}
                            >
                              <Ban className="h-4 w-4 mr-2" /> Void
                            </DropdownMenuItem>
                          </>
                        )}
                        {ticket.status !== 'valid' && (
                          <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
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
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} total tickets</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} /></PaginationItem>
              <PaginationItem><span className="text-sm px-3 py-2">Page {page} of {totalPages}</span></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <VoidDialog open={!!voidTarget} onOpenChange={(o) => !o && setVoidTarget(null)} ticket={voidTarget} />
    </div>
  );
}
