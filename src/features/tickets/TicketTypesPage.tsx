import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { BooleanBadge } from '@/components/common/StatusBadge';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useGetTicketTypesQuery, useCreateTicketTypeMutation, useUpdateTicketTypeMutation } from '@/api/apiSlice';
import { formatCurrency } from '@/utils/format';
import type { TicketType } from '@/types';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.string().min(1, 'Price is required'),
  display_order: z.coerce.number().min(0),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function TicketTypeDialog({ open, onOpenChange, ticketType }: { open: boolean; onOpenChange: (o: boolean) => void; ticketType: TicketType | null }) {
  const isEdit = !!ticketType;
  const [create, { isLoading: creating, error: ce }] = useCreateTicketTypeMutation();
  const [update, { isLoading: updating, error: ue }] = useUpdateTicketTypeMutation();
  const error = ce ?? ue;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: ticketType?.name ?? '',
      price: ticketType?.price ?? '',
      display_order: ticketType?.display_order ?? 0,
      is_active: ticketType?.is_active ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && ticketType) {
        await update({ id: ticketType.id, ...values }).unwrap();
        toast.success('Ticket type updated');
      } else {
        await create(values).unwrap();
        toast.success('Ticket type created');
      }
      reset();
      onOpenChange(false);
    } catch { /* shown */ }
  }

  const isActiveValue = watch('is_active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Ticket Type' : 'Add Ticket Type'}</DialogTitle>
        </DialogHeader>
        {error && <ErrorDisplay error={error} />}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tt-name">Name *</Label>
            <Input id="tt-name" {...register('name')} placeholder="e.g. Adult" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tt-price">Price *</Label>
              <Input id="tt-price" {...register('price')} placeholder="0.00" />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tt-order">Display Order</Label>
              <Input id="tt-order" type="number" {...register('display_order')} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="tt-active"
              checked={isActiveValue}
              onCheckedChange={(v) => setValue('is_active', Boolean(v))}
            />
            <Label htmlFor="tt-active" className="cursor-pointer">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={creating || updating}>
              {creating || updating ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TicketTypesPage() {
  const { data, isLoading, error } = useGetTicketTypesQuery({});
  const [formOpen, setFormOpen] = useState(false);
  const [editType, setEditType] = useState<TicketType | null>(null);

  function openCreate() { setEditType(null); setFormOpen(true); }
  function openEdit(t: TicketType) { setEditType(t); setFormOpen(true); }

  return (
    <div>
      <PageHeader
        title="Ticket Types"
        description="Manage gate ticket types and pricing"
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> Add Type</Button>}
      />
      {error && <ErrorDisplay error={error} />}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-none animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No ticket types found</TableCell>
              </TableRow>
            ) : (
              data?.results.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(t.price)}</TableCell>
                  <TableCell className="text-muted-foreground">{t.display_order}</TableCell>
                  <TableCell><BooleanBadge value={t.is_active} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TicketTypeDialog open={formOpen} onOpenChange={setFormOpen} ticketType={editType} />
    </div>
  );
}
