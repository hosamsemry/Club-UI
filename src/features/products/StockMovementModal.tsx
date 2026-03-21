import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useCreateStockMovementMutation, useGetProductsQuery } from '@/api/apiSlice';
import type { MovementType } from '@/types';
import { toast } from 'sonner';

const schema = z.object({
  product: z.string().min(1, 'Product is required'),
  movement_type: z.enum(['restock', 'sale', 'adjustment', 'refund']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  direction: z.enum(['in', 'out']).optional(),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedProductId?: number;
}

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: 'restock', label: 'Restock' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'refund', label: 'Refund' },
];

export function StockMovementModal({ open, onOpenChange, preselectedProductId }: Props) {
  const { data: productsData } = useGetProductsQuery({ is_active: 'true' });
  const [createMovement, { isLoading, error }] = useCreateStockMovementMutation();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      movement_type: 'restock',
      product: preselectedProductId ? String(preselectedProductId) : '',
    },
  });

  const movementType = watch('movement_type');

  async function onSubmit(values: FormValues) {
    const payload: Record<string, unknown> = {
      product: Number(values.product),
      movement_type: values.movement_type,
      quantity: values.quantity,
      note: values.note ?? '',
    };
    if (values.movement_type === 'adjustment') {
      payload['direction'] = values.direction ?? 'in';
    }
    try {
      await createMovement(payload as Parameters<typeof createMovement>[0]).unwrap();
      toast.success('Stock movement recorded');
      reset();
      onOpenChange(false);
    } catch {
      // error shown via ErrorDisplay
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>

        {error && <ErrorDisplay error={error} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Product *</Label>
            <Select
              onValueChange={(v) => setValue('product', v)}
              defaultValue={preselectedProductId ? String(preselectedProductId) : undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {productsData?.results.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product && <p className="text-xs text-destructive">{errors.product.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Movement Type *</Label>
            <Select onValueChange={(v) => setValue('movement_type', v as MovementType)} value={movementType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {movementType === 'adjustment' && (
            <div className="space-y-1.5">
              <Label>Direction *</Label>
              <Select onValueChange={(v) => setValue('direction', v as 'in' | 'out')} defaultValue="in">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">In (Add)</SelectItem>
                  <SelectItem value="out">Out (Remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input id="quantity" type="number" min={1} {...register('quantity')} />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" {...register('note')} placeholder="Optional note…" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
