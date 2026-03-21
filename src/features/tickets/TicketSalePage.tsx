import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useCreateTicketSaleMutation, useGetTicketTypesQuery } from '@/api/apiSlice';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';

const schema = z.object({
  buyer_name: z.string().min(1, 'Buyer name is required'),
  buyer_phone: z.string().min(1, 'Phone is required'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface TicketQuantity {
  ticket_type: number;
  name: string;
  price: string;
  quantity: number;
}

export function TicketSalePage() {
  const { data: ticketTypesData } = useGetTicketTypesQuery({ is_active: 'true' });
  const [createSale, { isLoading, error }] = useCreateTicketSaleMutation();
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function setQty(typeId: number, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [typeId]: Math.max(0, (prev[typeId] ?? 0) + delta),
    }));
  }

  const items: TicketQuantity[] = (ticketTypesData?.results ?? [])
    .map((t) => ({ ticket_type: t.id, name: t.name, price: t.price, quantity: quantities[t.id] ?? 0 }))
    .filter((t) => t.quantity > 0);

  const total = items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  );

  async function onSubmit(values: FormValues) {
    if (!visitDate) { toast.error('Please select a visit date'); return; }
    if (items.length === 0) { toast.error('Please add at least one ticket'); return; }

    try {
      await createSale({
        buyer_name: values.buyer_name,
        buyer_phone: values.buyer_phone,
        visit_date: format(visitDate, 'yyyy-MM-dd'),
        notes: values.notes ?? '',
        items: items.map((i) => ({ ticket_type: i.ticket_type, quantity: i.quantity })),
      }).unwrap();
      toast.success('Tickets sold successfully');
      reset();
      setVisitDate(undefined);
      setQuantities({});
    } catch {
      // error shown via ErrorDisplay
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Sell Tickets" description="Create a new gate ticket sale" />

      {error && <div className="mb-4"><ErrorDisplay error={error} /></div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Buyer Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Buyer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Buyer Name *</Label>
                <Input {...register('buyer_name')} placeholder="Full name" />
                {errors.buyer_name && <p className="text-xs text-destructive">{errors.buyer_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input {...register('buyer_phone')} placeholder="01000000000" />
                {errors.buyer_phone && <p className="text-xs text-destructive">{errors.buyer_phone.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Visit Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {visitDate ? format(visitDate, 'EEEE, MMMM d, yyyy') : 'Select visit date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={visitDate} onSelect={setVisitDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register('notes')} rows={2} placeholder="Optional notes…" />
            </div>
          </CardContent>
        </Card>

        {/* Ticket Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ticket Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketTypesData?.results.length === 0 && (
              <p className="text-sm text-muted-foreground">No active ticket types available</p>
            )}
            {ticketTypesData?.results.map((type) => (
              <div key={type.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">{type.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(type.price)} / ticket</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQty(type.id, -1)}
                    disabled={(quantities[type.id] ?? 0) === 0}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-sm">
                    {quantities[type.id] ?? 0}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQty(type.id, 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {items.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.ticket_type} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <Separator className="my-1.5" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading || items.length === 0}>
          {isLoading ? 'Processing…' : `Sell Tickets · ${formatCurrency(total)}`}
        </Button>
      </form>
    </div>
  );
}
