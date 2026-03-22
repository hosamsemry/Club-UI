import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useGetReportsQuery, useRegenerateReportMutation } from '@/api/apiSlice';
import { formatDate } from '@/utils/format';
import { getAccessToken } from '@/utils/auth';
import { API_BASE_URL } from '@/api/apiSlice';
import { toast } from 'sonner';
import { RevenueCalculator } from './RevenueCalculator';

export function ReportsPage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const params: Record<string, string> = { page: String(page) };
  if (startDate) params['start_date'] = startDate;
  if (endDate) params['end_date'] = endDate;

  const { data, isLoading, error } = useGetReportsQuery(params);
  const [regenerate] = useRegenerateReportMutation();
  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  function handleExport(reportId: number) {
    const token = getAccessToken();
    const url = `${API_BASE_URL}/api/reporting/daily/${reportId}/export/csv/`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `report-${reportId}.csv`);
    if (token) {
      // Use fetch to handle auth
      void fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          a.href = blobUrl;
          a.click();
          URL.revokeObjectURL(blobUrl);
        })
        .catch(() => toast.error('Export failed'));
    } else {
      a.click();
    }
  }

  async function handleRegenerate(reportId: number) {
    try {
      await regenerate(reportId).unwrap();
      toast.success('Report regeneration scheduled');
    } catch {
      toast.error('Failed to schedule regeneration');
    }
  }

  return (
    <div>
      <PageHeader title="Daily Reports" description="View and export daily operation reports" />

      <div className="mb-6">
        <RevenueCalculator />
      </div>

      {error && <ErrorDisplay error={error} />}

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End Date</Label>
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-40" />
        </div>
        {(startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-none animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Report Date</TableHead>
              <TableHead>CSV Available</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">No reports found</TableCell>
              </TableRow>
            ) : (
              data?.results.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{formatDate(report.report_date)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.csv_file ? '✓ Available' : 'Not generated'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(report.id)}
                        className="h-7 text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRegenerate(report.id)}
                        className="h-7 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} reports</p>
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
