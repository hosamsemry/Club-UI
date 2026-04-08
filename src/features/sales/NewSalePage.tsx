import { useState, useDeferredValue, useRef, useEffect, useCallback } from 'react';
import { Minus, Package, Plus, Search, ShoppingCart, Trash2, X, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
      {['', ...categories.map((c) => String(c.id))].map((id, idx) => {
        const label = idx === 0 ? 'All' : categories[idx - 1].name;
        const active = selectedId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`
              shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide
              transition-all duration-200 border
              ${active
                ? 'border-black bg-black text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {label}
          </button>
        );
      })}
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
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease' }}
      className={`
        group relative flex flex-col gap-2.5 rounded-2xl border p-4 text-left bg-white
        hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]
        active:translate-y-0 active:scale-[0.97]
        disabled:cursor-not-allowed disabled:opacity-40
        ${cartQty > 0
          ? 'border-black shadow-[0_0_0_1px_rgba(0,0,0,0.15)]'
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
    >
      {/* Cart qty badge */}
      {cartQty > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[0.6rem] font-black text-white shadow-lg ring-2 ring-white">
          {cartQty}
        </span>
      )}

      {/* Best seller flame */}
      {product.is_best_seller && (
        <span className="absolute left-2.5 top-2.5 flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[0.6rem] font-bold text-amber-600 border border-amber-100">
          🔥 Hot
        </span>
      )}

      <div className={`min-w-0 w-full ${product.is_best_seller ? 'mt-5' : ''}`}>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-800 group-hover:text-gray-900">
          {product.name}
        </p>
        {product.sku && (
          <p className="mt-0.5 truncate font-mono text-[0.65rem] text-gray-500">{product.sku}</p>
        )}
      </div>

      <p className="font-mono text-base font-bold text-green-800 tracking-tight">
        {formatCurrency(product.selling_price)}
      </p>

      <div>
        {isLowStock ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[0.62rem] font-semibold text-red-500 border border-red-100">
            ⚠ {product.stock_quantity} left
          </span>
        ) : (
          <span className="text-[0.65rem] text-gray-400">{product.stock_quantity} in stock</span>
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
    <div className="group flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-3 transition-colors hover:border-gray-300 hover:bg-gray-100">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800 leading-snug">{item.product.name}</p>
        <p className="mt-1 font-mono text-xs text-gray-500">
          {formatCurrency(item.product.selling_price)} × {item.quantity}
        </p>
        <p className="mt-1.5 font-mono text-sm font-bold text-green-800">
          {formatCurrency(item.quantity * parseFloat(item.product.selling_price))}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => onRemove(item.product.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 transition-all hover:text-red-400 hover:scale-110"
          aria-label="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onQtyChange(item.product.id, item.quantity - 1)}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-all hover:border-gray-400 hover:text-gray-700 active:scale-90"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-7 text-center font-mono text-sm font-bold text-gray-800 tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQtyChange(item.product.id, item.quantity + 1)}
            disabled={item.quantity >= item.product.stock_quantity}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-all hover:border-gray-400 hover:text-gray-700 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="h-3 w-3" />
          </button>
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
    if (qty <= 0) { removeFromCart(productId); return; }
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

  // ── Product browser ────────────────────────────────────────────────────
  const productBrowser = (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            autoFocus
            className="
              w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4
              text-sm text-gray-800 placeholder-gray-400
              outline-none ring-0
              transition-all duration-200
              focus:border-gray-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]
            "
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <CategoryChips selectedId={categoryId} onSelect={setCategoryId} />
      </div>

      {/* Product grid */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        {isLoading && page === 1 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : accumulatedProducts.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-gray-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200">
              <Package className="h-7 w-7 opacity-40" />
            </div>
            <p className="text-gray-400">
              {deferredSearch || categoryId ? 'No products match your filters.' : 'No products in stock.'}
            </p>
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
                  <Skeleton key={`sk-${i}`} className="h-32 rounded-2xl bg-gray-100" />
                ))}
            </div>

            {hasMore && !isFetching && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                >
                  Load more · {data!.count - accumulatedProducts.length} remaining
                </button>
              </div>
            )}
            {!hasMore && data && data.count > PAGE_SIZE && (
              <p className="mt-4 text-center text-xs text-gray-400">
                All {data.count} products loaded
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );

  // ── Cart panel ─────────────────────────────────────────────────────────
  const cartPanel = (
    <>
      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-3">
          {cart.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                <ShoppingCart className="h-5 w-5 text-gray-300" />
              </div>
              <p className="text-xs text-gray-400">Tap a product to add it here</p>
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
      <div className="shrink-0 space-y-3.5 border-t border-gray-200 bg-white p-4">
        {error && <ErrorDisplay error={error} />}

        <div className="space-y-1.5">
          <label htmlFor="sale-note" className="text-[0.7rem] font-semibold uppercase tracking-widest text-gray-400">
            Note
          </label>
          <textarea
            id="sale-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. table 4, member discount…"
            rows={2}
            className="
              w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2
              text-sm text-gray-700 placeholder-gray-400
              outline-none transition-all
              focus:border-gray-300 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]
            "
          />
        </div>

        <div className="h-px bg-gray-200" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400">Total</p>
            {cartItemCount > 0 && (
              <p className="text-[0.65rem] text-gray-400">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          <p className="font-mono text-2xl font-black text-black-600 tracking-tight">
            {formatCurrency(cartTotal)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || cart.length === 0}
          className="
            relative w-full overflow-hidden rounded-xl px-4 py-3.5
            bg-black text-white font-bold text-sm
            transition-all duration-200
            hover:bg-gray-900 hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)]
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
            flex items-center justify-center gap-2
          "
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
              Processing…
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Complete Sale · {formatCurrency(cartTotal)}
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="space-y-5 p-1">
        <PageHeader
          title="New Sale"
          description="Select products to add to the cart, then complete the sale."
        />

        {/* ── Desktop: side-by-side ─────────────────────────────────────── */}
        <div className="hidden lg:flex items-start gap-5">
          {/* Products */}
          <div className="min-w-0 flex-1">
            {productBrowser}
          </div>

          {/* Cart — sticky */}
          <div
            className="flex w-[22rem] shrink-0 flex-col rounded-2xl border border-gray-200 bg-white sticky top-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            style={{ maxHeight: 'calc(100vh - 56px - 48px)' }}
          >
            {/* Cart header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 border border-gray-200">
                  <ShoppingCart className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Cart</span>
                {cartItemCount > 0 && (
                  <span className="rounded-md bg-black px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                    {cartItemCount}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.7rem] font-medium text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            {cartPanel}
          </div>
        </div>

        {/* ── Mobile: tabbed ──────────────────────────────────────────────── */}
        <div className="lg:hidden">
          <Tabs defaultValue="products">
            <TabsList className="w-full rounded-xl bg-gray-100 border border-gray-200 p-1">
              <TabsTrigger
                value="products"
                className="flex-1 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-sm text-gray-400"
              >
                Products
                {accumulatedProducts.length > 0 && (
                  <span className="ml-1.5 font-mono text-[0.6rem] text-gray-400">
                    ({accumulatedProducts.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="cart"
                className="relative flex-1 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-sm text-gray-400"
              >
                Cart
                {cartItemCount > 0 && (
                  <span className="ml-1.5 rounded-md bg-amber-400/20 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-amber-400">
                    {cartItemCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-4">
              {productBrowser}
            </TabsContent>

            <TabsContent value="cart" className="mt-4">
              <div className="flex flex-col rounded-2xl border border-gray-200 bg-white">
                <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 border border-gray-200">
                      <ShoppingCart className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Cart</span>
                    {cartItemCount > 0 && (
                      <span className="rounded-md bg-black px-1.5 py-0.5 font-mono text-[0.65rem] font-bold text-white">
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.7rem] font-medium text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-3 w-3" />
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
    </div>
  );
}