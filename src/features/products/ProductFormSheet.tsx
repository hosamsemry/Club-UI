import { useEffect } from 'react';
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
import { useCreateProductMutation, useUpdateProductMutation, useGetCategoriesQuery } from '@/api/apiSlice';
import type { Product } from '@/types';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  sku: z.string().min(1, 'SKU is required'),
  cost_price: z.string().min(1, 'Cost price is required'),
  selling_price: z.string().min(1, 'Selling price is required'),
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
  const [createProduct, { isLoading: creating, error: createError }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating, error: updateError }] = useUpdateProductMutation();
  const isSaving = creating || updating;
  const error = createError ?? updateError;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, stock_quantity: 0, low_stock_threshold: 10 },
  });

  useEffect(() => {
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
      reset({ is_active: true, stock_quantity: 0, low_stock_threshold: 10 });
    }
  }, [product, reset]);

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
    } catch {
      // error shown via ErrorDisplay
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Water 500ml" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={(v) => setValue('category', v)} value={watch('category')}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.results.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input id="low_stock_threshold" type="number" {...register('low_stock_threshold')} />
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
