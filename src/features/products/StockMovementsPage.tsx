import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { StockMovementModal } from './StockMovementModal';
import { useGetStockMovementsQuery } from '@/api/apiSlice';
import { formatDateTime, formatMovementType } from '@/utils/format';

const MOVEMENT_COLORS: Record<string, string> = {
  restock: 'bg-green-100 text-green-800 border-green-200',
  sale: 'bg-blue-100 text-blue-800 border-blue-200',
  adjustment: 'bg-amber-100 text-amber-800 border-amber-200',
  refund: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function StockMovementsPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, error } = useGetStockMovementsQuery({ page: String(page) });
  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Inventory movement history"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Record Movement
          </Button>
        }
      />

      {error && <ErrorDisplay error={error} />}

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No stock movements found
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="font-medium">{movement.product_name ?? `Product #${movement.product}`}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${MOVEMENT_COLORS[movement.movement_type] ?? ''}`}>
                      {formatMovementType(movement.movement_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">{movement.direction ?? '—'}</TableCell>
                  <TableCell className="text-right font-mono">{movement.quantity}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{movement.note || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDateTime(movement.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} total movements</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} /></PaginationItem>
              <PaginationItem><span className="text-sm px-3 py-2">Page {page} of {totalPages}</span></PaginationItem>
              <PaginationItem><PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <StockMovementModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
