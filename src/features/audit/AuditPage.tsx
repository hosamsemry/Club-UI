import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useGetAuditLogsQuery } from '@/api/apiSlice';
import { formatDateTime, formatAction } from '@/utils/format';

const ACTION_COLORS: Record<string, string> = {
  sale_created: 'bg-blue-100 text-blue-800',
  sale_refunded: 'bg-orange-100 text-orange-800',
  reservation_created: 'bg-purple-100 text-purple-800',
  reservation_cancelled: 'bg-red-100 text-red-800',
  payment_recorded: 'bg-green-100 text-green-800',
  ticket_checked_in: 'bg-teal-100 text-teal-800',
  ticket_voided: 'bg-gray-100 text-gray-700',
  stock_movement: 'bg-amber-100 text-amber-800',
};

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const params: Record<string, string> = { page: String(page) };
  if (search) params['search'] = search;
  if (startDate) params['start_date'] = startDate;
  if (endDate) params['end_date'] = endDate;

  const { data, isLoading, error } = useGetAuditLogsQuery(params);
  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <div>
      <PageHeader title="Audit Logs" description="Staff activity and system events" />

      {error && <ErrorDisplay error={error} />}

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-48"
            placeholder="Search…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End Date</Label>
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-40" />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">No audit logs found</TableCell>
              </TableRow>
            ) : (
              data?.results.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {formatAction(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.user_email}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDateTime(log.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} log entries</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} /></PaginationItem>
              <PaginationItem><span className="text-sm px-3 py-2">Page {page} of {totalPages}</span></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
