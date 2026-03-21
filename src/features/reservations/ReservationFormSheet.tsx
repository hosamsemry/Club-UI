import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import {
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useGetOccasionTypesQuery,
} from '@/api/apiSlice';
import type { Reservation } from '@/types';
import { toast } from 'sonner';

const schema = z.object({
  occasion_type: z.string().min(1, 'Occasion type is required'),
  guest_name: z.string().min(1, 'Guest name is required'),
  guest_phone: z.string().min(1, 'Phone is required'),
  guest_count: z.coerce.number().min(1),
  total_amount: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation | null;
}

export function ReservationFormSheet({ open, onOpenChange, reservation }: Props) {
  const isEdit = !!reservation;
  const { data: occasionTypesData } = useGetOccasionTypesQuery({});
  const [createReservation, { isLoading: creating, error: ce }] = useCreateReservationMutation();
  const [updateReservation, { isLoading: updating, error: ue }] = useUpdateReservationMutation();
  const error = ce ?? ue;
  const isSaving = creating || updating;

  const [startsAt, setStartsAt] = useState<Date | undefined>();
  const [endsAt, setEndsAt] = useState<Date | undefined>();
  const [startsTime, setStartsTime] = useState('18:00');
  const [endsTime, setEndsTime] = useState('23:00');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { guest_count: 1 },
  });

  useEffect(() => {
    if (reservation) {
      reset({
        occasion_type: String(reservation.occasion_type),
        guest_name: reservation.guest_name,
        guest_phone: reservation.guest_phone,
        guest_count: reservation.guest_count,
        total_amount: reservation.total_amount,
        notes: reservation.notes,
      });
    } else {
      reset({ guest_count: 1 });
      setStartsAt(undefined);
      setEndsAt(undefined);
    }
  }, [reservation, reset]);

  function combineDateTime(date: Date | undefined, time: string): string {
    if (!date) return '';
    const [h, m] = time.split(':');
    const d = new Date(date);
    d.setHours(Number(h), Number(m), 0, 0);
    return d.toISOString();
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      occasion_type: Number(values.occasion_type),
      starts_at: combineDateTime(startsAt, startsTime),
      ends_at: combineDateTime(endsAt, endsTime),
    };
    try {
      if (isEdit && reservation) {
        await updateReservation({ id: reservation.id, ...payload }).unwrap();
        toast.success('Reservation updated');
      } else {
        await createReservation(payload).unwrap();
        toast.success('Reservation created');
      }
      onOpenChange(false);
    } catch {
      // error shown via ErrorDisplay
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>{isEdit ? 'Edit Reservation' : 'Create Reservation'}</SheetTitle>
        </SheetHeader>

        {error && <div className="mb-4"><ErrorDisplay error={error} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1.5 lg:p-3">
          <div className="space-y-1.5">
            <Label>Occasion Type *</Label>
            <Select onValueChange={(v) => setValue('occasion_type', v as string)} value={watch('occasion_type')}>
              <SelectTrigger>
                <SelectValue placeholder="Select occasion" />
              </SelectTrigger>
              <SelectContent>
                {occasionTypesData?.results.filter((o) => o.is_active).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.occasion_type && <p className="text-xs text-destructive">{errors.occasion_type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Guest Name *</Label>
              <Input {...register('guest_name')} placeholder="Full name" />
              {errors.guest_name && <p className="text-xs text-destructive">{errors.guest_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Guest Phone *</Label>
              <Input {...register('guest_phone')} placeholder="01000000000" />
              {errors.guest_phone && <p className="text-xs text-destructive">{errors.guest_phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starts At *</Label>
              <Popover>
                <PopoverTrigger render={<Button variant="outline" className="w-full justify-start text-left font-normal" />}>
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {startsAt ? format(startsAt, 'MMM d, yyyy') : 'Pick date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startsAt} onSelect={setStartsAt} />
                </PopoverContent>
              </Popover>
              <Input type="time" value={startsTime} onChange={(e) => setStartsTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ends At *</Label>
              <Popover>
                <PopoverTrigger render={<Button variant="outline" className="w-full justify-start text-left font-normal" />}>
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {endsAt ? format(endsAt, 'MMM d, yyyy') : 'Pick date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endsAt} onSelect={setEndsAt} />
                </PopoverContent>
              </Popover>
              <Input type="time" value={endsTime} onChange={(e) => setEndsTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Guest Count *</Label>
              <Input type="number" min={1} {...register('guest_count')} />
            </div>
            <div className="space-y-1.5">
              <Label>Total Amount *</Label>
              <Input {...register('total_amount')} placeholder="0.00" />
              {errors.total_amount && <p className="text-xs text-destructive">{errors.total_amount.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={2} placeholder="Optional notes…" />
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
