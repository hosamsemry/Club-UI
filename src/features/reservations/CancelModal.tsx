import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useCancelReservationMutation } from '@/api/apiSlice';
import type { Reservation } from '@/types';
import { toast } from 'sonner';

const schema = z.object({
  refund_amount: z.string().min(1, 'Refund amount is required'),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
}

export function CancelModal({ open, onOpenChange, reservation }: Props) {
  const [cancelReservation, { isLoading, error }] = useCancelReservationMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { refund_amount: '0.00' },
  });

  async function onSubmit(values: FormValues) {
    if (!reservation) return;
    try {
      await cancelReservation({
        id: reservation.id,
        refund_amount: values.refund_amount,
        note: values.note ?? '',
      }).unwrap();
      toast.success('Reservation cancelled');
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
          <DialogTitle>Cancel Reservation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Cancelling reservation for <strong>{reservation?.guest_name}</strong>. Enter the refund amount.
        </p>

        {error && <ErrorDisplay error={error} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="refund_amount">Refund Amount *</Label>
            <Input id="refund_amount" {...register('refund_amount')} placeholder="0.00" />
            {errors.refund_amount && <p className="text-xs text-destructive">{errors.refund_amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancel_note">Note</Label>
            <Textarea id="cancel_note" {...register('note')} rows={2} placeholder="Reason for cancellation" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Keep Reservation</Button>
            <Button type="submit" disabled={isLoading} variant="destructive">
              {isLoading ? 'Cancelling…' : 'Cancel Reservation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
