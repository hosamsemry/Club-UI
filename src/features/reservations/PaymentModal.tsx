import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useRecordPaymentMutation } from '@/api/apiSlice';
import type { Reservation } from '@/types';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';

const schema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
}

export function PaymentModal({ open, onOpenChange, reservation }: Props) {
  const [recordPayment, { isLoading, error }] = useRecordPaymentMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const remaining = reservation
    ? parseFloat(reservation.total_amount) - parseFloat(reservation.paid_amount ?? '0')
    : 0;

  async function onSubmit(values: FormValues) {
    if (!reservation) return;
    try {
      await recordPayment({ id: reservation.id, amount: values.amount, note: values.note ?? '' }).unwrap();
      toast.success('Payment recorded');
      reset();
      onOpenChange(false);
    } catch {
      // error shown via ErrorDisplay
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {reservation && (
          <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-medium">{formatCurrency(reservation.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium text-green-700">{formatCurrency(reservation.paid_amount ?? '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-semibold ${remaining > 0 ? 'text-amber-600' : 'text-green-700'}`}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        )}

        {error && <ErrorDisplay error={error} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input id="amount" {...register('amount')} placeholder="0.00" />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" {...register('note')} rows={2} placeholder="e.g. Advance payment" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Recording…' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
