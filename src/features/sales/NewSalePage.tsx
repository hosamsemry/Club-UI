import { useState, useDeferredValue, useRef, useEffect, useCallback } from 'react';
import { Minus, Package, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useGetProductsQuery, useGetCategoriesQuery, useCreateSaleMutation } from '@/api/apiSlice';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';
import { toast } from 'sonner';

const PAGE_SIZE = 24;

interface CartItem {
  product: Product;
  quantity: number;
}

// ── Category filter chip bar ────────────────────────────────────────────────
function CategoryChips({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { data } = useGetCategoriesQuery({});
  const categories = data?.results ?? [];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onSelect('')}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
          selectedId === ''
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(String(cat.id))}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            selectedId === String(cat.id)
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

// ── Product tile ─────────────────────────────────────────────────────────────
function ProductTile({
  product,
  cartQty,
  onAdd,
}: {
  product: Product;
  cartQty: number;
  onAdd: (product: Product) => void;
}) {
  const isLowStock = product.stock_quantity <= product.low_stock_threshold;
  const maxReached = cartQty >= product.stock_quantity;

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={maxReached}
      className="group relative flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {cartQty > 0 && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground">
          {cartQty}
        </span>
      )}
      <div className="w-full min-w-0 pr-6">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
        {product.sku && (
          <p className="mt-0.5 truncate font-mono text-[0.65rem] text-muted-foreground">{product.sku}</p>
        )}
      </div>
      <p className="text-sm font-semibold text-primary">{formatCurrency(product.selling_price)}</p>
      <div>
        {isLowStock ? (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[0.65rem]">
            Low: {product.stock_quantity}
          </Badge>
        ) : (
          <span className="text-[0.7rem] text-muted-foreground">{product.stock_quantity} in stock</span>
        )}
      </div>
    </button>
  );
}

// ── Cart item row ─────────────────────────────────────────────────────────────
function CartRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item: CartItem;
  onQtyChange: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted/30 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-snug">{item.product.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatCurrency(item.product.selling_price)} each
        </p>
        <p className="mt-1 text-xs font-semibold text-primary">
          {formatCurrency(item.quantity * parseFloat(item.product.selling_price))}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => onRemove(item.product.id)}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-6 w-6"
            onClick={() => onQtyChange(item.product.id, item.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-6 w-6"
            onClick={() => onQtyChange(item.product.id, item.quantity + 1)}
            disabled={item.quantity >= item.product.stock_quantity}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function NewSalePage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [accumulatedProducts, setAccumulatedProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState('');
  const deferredSearch = useDeferredValue(search.trim());

  // Reset accumulated list and page whenever filters change
  const prevFilterRef = useRef({ search: deferredSearch, categoryId });
  useEffect(() => {
    const prev = prevFilterRef.current;
    if (prev.search !== deferredSearch || prev.categoryId !== categoryId) {
      setPage(1);
      setAccumulatedProducts([]);
      prevFilterRef.current = { search: deferredSearch, categoryId };
    }
  }, [deferredSearch, categoryId]);

  const queryParams: Record<string, string> = {
    is_active: 'true',
    page: String(page),
    page_size: String(PAGE_SIZE),
  };
  if (deferredSearch) queryParams.search = deferredSearch;
  if (categoryId) queryParams.category = categoryId;

  const { data, isLoading, isFetching } = useGetProductsQuery(queryParams);
  const [createSale, { isLoading: isSubmitting, error }] = useCreateSaleMutation();

  // Accumulate products on each new page
  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setAccumulatedProducts(data.results);
    } else {
      setAccumulatedProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const fresh = data.results.filter((p) => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });
    }
  }, [data, page]);

  const hasMore = data ? accumulatedProducts.length < data.count : false;

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  // ── Cart helpers ────────────────────────────────────────────────────────
  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > product.stock_quantity) {
          toast.warning(`Only ${product.stock_quantity} available for "${product.name}"`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: newQty } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function setCartItemQty(productId: number, qty: number) {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        return { ...i, quantity: Math.min(qty, i.product.stock_quantity) };
      }),
    );
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setNote('');
  }

  const cartTotal = cart.reduce(
    (sum, i) => sum + i.quantity * parseFloat(i.product.selling_price),
    0,
  );
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  async function handleSubmit() {
    if (cart.length === 0) {
      toast.warning('Add at least one product to the cart');
      return;
    }
    try {
      await createSale({
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
        })),
        note: note.trim() || undefined,
      }).unwrap();
      toast.success(`Sale of ${formatCurrency(cartTotal)} completed!`);
      clearCart();
    } catch {
      // shown via ErrorDisplay
    }
  }

  const cartQtyMap = Object.fromEntries(cart.map((i) => [i.product.id, i.quantity]));

  // ── Shared sub-sections ────────────────────────────────────────────────
  const productBrowser = (
    <div className="flex flex-col gap-3">
      {/* Search + Category chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="pl-9"
            autoFocus
          />
        </div>
        <CategoryChips selectedId={categoryId} onSelect={setCategoryId} />
      </div>

      {/* Product grid */}
      <div className="rounded-xl border border-border/60 p-4">
        {isLoading && page === 1 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : accumulatedProducts.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Package className="h-8 w-8 opacity-25" />
            <p>{deferredSearch || categoryId ? 'No products match your filters.' : 'No products in stock.'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {accumulatedProducts.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  cartQty={cartQtyMap[product.id] ?? 0}
                  onAdd={addToCart}
                />
              ))}
              {isFetching && page > 1 &&
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={`sk-${i}`} className="h-28 rounded-xl" />
                ))}
            </div>

            {hasMore && !isFetching && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" onClick={handleLoadMore}>
                  Load more ({data!.count - accumulatedProducts.length} remaining)
                </Button>
              </div>
            )}
            {!hasMore && data && data.count > PAGE_SIZE && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                All {data.count} products loaded
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );

  const cartPanel = (
    <>
      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-3">
          {cart.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <ShoppingCart className="h-8 w-8 opacity-20" />
              <p>Tap a product to add it here</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartRow
                key={item.product.id}
                item={item}
                onQtyChange={setCartItemQty}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 space-y-3 border-t border-border/60 p-4">
        {error && <ErrorDisplay error={error} />}

        <div className="space-y-1.5">
          <Label htmlFor="sale-note" className="text-xs">Note (optional)</Label>
          <Textarea
            id="sale-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. table 4, member discount…"
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold tracking-tight">{formatCurrency(cartTotal)}</span>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? 'Processing…' : `Complete Sale · ${formatCurrency(cartTotal)}`}
        </Button>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="New Sale"
        description="Select products to add to the cart, then complete the sale."
      />

      {/* ── Desktop: side-by-side, cart sticky ─────────────────────────── */}
      <div className="hidden lg:flex items-start gap-5">
        {/* Products — scrolls with the page */}
        <div className="min-w-0 flex-1">
          {productBrowser}
        </div>

        {/* Cart — sticks in viewport as products scroll */}
        <div
          className="flex w-80 shrink-0 flex-col rounded-xl border border-border/60 bg-card sticky top-0"
          style={{ maxHeight: 'calc(100vh - 56px - 64px)' }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Cart
                {cartItemCount > 0 && (
                  <span className="ml-1.5 text-muted-foreground">({cartItemCount} items)</span>
                )}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-destructive hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          {cartPanel}
        </div>
      </div>

      {/* ── Mobile: tabbed ────────────────────────────────────────────── */}
      <div className="lg:hidden">
        <Tabs defaultValue="products">
          <TabsList className="w-full">
            <TabsTrigger value="products" className="flex-1">
              Products
              {accumulatedProducts.length > 0 && (
                <span className="ml-1.5 text-muted-foreground text-xs">({accumulatedProducts.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cart" className="relative flex-1">
              Cart
              {cartItemCount > 0 && (
                <Badge className="ml-1.5 h-5 min-w-5 px-1 text-[0.65rem]">{cartItemCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            {productBrowser}
          </TabsContent>

          <TabsContent value="cart" className="mt-4">
            <div className="flex flex-col rounded-xl border border-border/60 bg-card">
              <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Cart
                    {cartItemCount > 0 && (
                      <span className="ml-1.5 text-muted-foreground">({cartItemCount} items)</span>
                    )}
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-destructive hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              {cartPanel}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
