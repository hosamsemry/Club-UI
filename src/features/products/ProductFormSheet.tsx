import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
} from '@/api/apiSlice';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { extractErrorDetails, extractMessage } from '@/utils/error';

const schema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
  category: z.string({ message: 'Category is required' }).min(1, 'Category is required'),
  sku: z.string({ message: 'SKU is required' }).min(1, 'SKU is required'),
  cost_price: z.string({ message: 'Cost price is required' }).min(1, 'Cost price is required'),
  selling_price: z.string({ message: 'Selling price is required' }).min(1, 'Selling price is required'),
  stock_quantity: z.coerce.number().min(0),
  low_stock_threshold: z.coerce.number().min(0),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormSheet({ open, onOpenChange, product }: Props) {
  const isEdit = !!product;
  const { data: categoriesData } = useGetCategoriesQuery({});
  const [createProduct, { isLoading: creating, error: createError, reset: resetCreate }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating, error: updateError, reset: resetUpdate }] = useUpdateProductMutation();
  const [createCategoryMutation, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const isSaving = creating || updating;
  const error = isEdit ? updateError : createError;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: '',
      category: '',
      sku: '',
      cost_price: '',
      selling_price: '',
      is_active: true,
      stock_quantity: 0,
      low_stock_threshold: 10,
    },
  });

  useEffect(() => {
    resetCreate();
    resetUpdate();
    setShowCreateCategory(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setCategoryError('');
    if (open) {
      if (product) {
        reset({
          name: product.name,
          category: String(product.category),
          sku: product.sku,
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          stock_quantity: product.stock_quantity,
          low_stock_threshold: product.low_stock_threshold,
          is_active: product.is_active,
        });
      } else {
        reset({
          name: '',
          category: '',
          sku: '',
          cost_price: '',
          selling_price: '',
          is_active: true,
          stock_quantity: 0,
          low_stock_threshold: 10,
        });
      }
    }
  }, [open, product, reset, resetCreate, resetUpdate]);

  async function handleCreateCategoryOnTheFly() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError('Category name is required.');
      return;
    }
    setCategoryError('');
    try {
      const created = await createCategoryMutation({
        name: trimmed,
        description: newCategoryDescription.trim() || undefined,
      }).unwrap();
      toast.success(`Category "${created.name}" created!`);
      setValue('category', String(created.id), { shouldValidate: true, shouldDirty: true });
      clearErrors('category');
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCreateCategory(false);
    } catch (err: unknown) {
      setCategoryError(extractMessage(err));
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = { ...values, category: Number(values.category) };
    try {
      if (isEdit && product) {
        await updateProduct({ id: product.id, ...payload }).unwrap();
        toast.success('Product updated');
      } else {
        await createProduct(payload).unwrap();
        toast.success('Product created');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const details = extractErrorDetails(err);
      for (const [field, msg] of Object.entries(details.fieldErrors)) {
        if (
          [
            'name',
            'category',
            'sku',
            'cost_price',
            'selling_price',
            'stock_quantity',
            'low_stock_threshold',
          ].includes(field)
        ) {
          setError(field as keyof FormValues, { message: msg });
        }
      }
      toast.error(details.message);
    }
  }

  const isActiveValue = watch('is_active');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>{isEdit ? 'Edit Product' : 'Add Product'}</SheetTitle>
        </SheetHeader>

        {error && <div className="mb-4"><ErrorDisplay error={error} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1.5 lg:p-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Water 500ml" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Category *</Label>
              {!showCreateCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCategory(true);
                    setCategoryError('');
                  }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  + New Category
                </button>
              )}
            </div>

            {showCreateCategory && (
              <div className="p-3 bg-muted/60 border border-primary/20 rounded-lg space-y-2.5 animate-scale-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Create Category On the Fly</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateCategory(false);
                      setCategoryError('');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {categoryError && <p className="text-xs text-destructive">{categoryError}</p>}
                <div className="space-y-1.5">
                  <Input
                    placeholder="Category name (e.g. Beverages)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategoryOnTheFly();
                      }
                    }}
                    autoFocus
                    className="h-8 text-sm bg-background"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategoryOnTheFly();
                      }
                    }}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowCreateCategory(false);
                      setCategoryError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    onClick={handleCreateCategoryOnTheFly}
                  >
                    {isCreatingCategory ? 'Creating…' : 'Create & Select'}
                  </Button>
                </div>
              </div>
            )}

            {!showCreateCategory && categoriesData && categoriesData.results.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-2">
                <p className="text-amber-700 dark:text-amber-400 font-medium">
                  No categories found yet. You must create a category before adding a product.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full border-amber-500/40 hover:bg-amber-500/20"
                  onClick={() => {
                    setShowCreateCategory(true);
                    setCategoryError('');
                  }}
                >
                  + Create Category on the fly
                </Button>
              </div>
            ) : (
              <Select
                onValueChange={(v) => v && setValue('category', v, { shouldValidate: true })}
                value={watch('category')}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.results.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU *</Label>
            <Input id="sku" {...register('sku')} placeholder="e.g. WATER-500" />
            {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cost_price">Cost Price *</Label>
              <Input id="cost_price" {...register('cost_price')} placeholder="0.00" />
              {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="selling_price">Selling Price *</Label>
              <Input id="selling_price" {...register('selling_price')} placeholder="0.00" />
              {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input id="stock_quantity" type="number" {...register('stock_quantity')} />
              {errors.stock_quantity && <p className="text-xs text-destructive">{errors.stock_quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input id="low_stock_threshold" type="number" {...register('low_stock_threshold')} />
              {errors.low_stock_threshold && <p className="text-xs text-destructive">{errors.low_stock_threshold.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={isActiveValue}
              onCheckedChange={(v) => setValue('is_active', Boolean(v))}
            />
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
