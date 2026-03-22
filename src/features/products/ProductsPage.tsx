import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, ArrowLeftRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { BooleanBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ProductFormSheet } from './ProductFormSheet';
import { StockMovementModal } from './StockMovementModal';
import { useGetProductsQuery, useGetCategoriesQuery, useDeleteProductMutation } from '@/api/apiSlice';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';
import { toast } from 'sonner';

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementProductId, setMovementProductId] = useState<number | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const params: Record<string, string> = { page: String(page) };
  if (search) params['search'] = search;
  if (categoryFilter) params['category'] = categoryFilter;
  if (activeFilter) params['is_active'] = activeFilter;

  const { data, isLoading, error } = useGetProductsQuery(params);
  const { data: categoriesData } = useGetCategoriesQuery({});
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  function openEdit(product: Product) {
    setEditProduct(product);
    setFormOpen(true);
  }

  function openCreate() {
    setEditProduct(null);
    setFormOpen(true);
  }

  function openMovement(productId: number) {
    setMovementProductId(productId);
    setMovementOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id).unwrap();
      toast.success('Product deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete product');
    }
  }

  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalogue"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Product
          </Button>
        }
      />

      {error && <ErrorDisplay error={error} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-56"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === 'all' || !v ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoriesData?.results.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v === 'all' || !v ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-none animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category_name ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(product.selling_price)}</TableCell>
                  <TableCell className="text-right">
                    <span className={product.stock_quantity <= product.low_stock_threshold ? 'text-amber-600 font-semibold' : ''}>
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell><BooleanBadge value={product.is_active} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openMovement(product.id)}>
                          <ArrowLeftRight className="h-4 w-4 mr-2" /> Stock Movement
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data?.count ?? 0} total products
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm px-3 py-2">Page {page} of {totalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <ProductFormSheet open={formOpen} onOpenChange={setFormOpen} product={editProduct} />
      <StockMovementModal
        open={movementOpen}
        onOpenChange={setMovementOpen}
        preselectedProductId={movementProductId}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
