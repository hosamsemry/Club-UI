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
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useGetEntryDaysQuery, useCreateEntryDayMutation, useUpdateEntryDayMutation } from '@/api/apiSlice';
import { formatDate } from '@/utils/format';
import type { EntryDay } from '@/types';
import { toast } from 'sonner';

const schema = z.object({
  visit_date: z.string().min(1, 'Date is required'),
  daily_capacity: z.coerce.number().min(1),
  is_open: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function EntryDayDialog({ open, onOpenChange, day }: { open: boolean; onOpenChange: (o: boolean) => void; day: EntryDay | null }) {
  const isEdit = !!day;
  const [create, { isLoading: creating, error: ce }] = useCreateEntryDayMutation();
  const [update, { isLoading: updating, error: ue }] = useUpdateEntryDayMutation();
  const error = ce ?? ue;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      visit_date: day?.visit_date ?? '',
      daily_capacity: day?.daily_capacity ?? 100,
      is_open: day?.is_open ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && day) {
        await update({ id: day.id, ...values }).unwrap();
        toast.success('Entry day updated');
      } else {
        await create(values).unwrap();
        toast.success('Entry day created');
      }
      reset();
      onOpenChange(false);
    } catch { /* shown */ }
  }

  const isOpenValue = watch('is_open');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Entry Day' : 'Add Entry Day'}</DialogTitle>
        </DialogHeader>
        {error && <ErrorDisplay error={error} />}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ed-date">Visit Date *</Label>
            <Input id="ed-date" type="date" {...register('visit_date')} />
            {errors.visit_date && <p className="text-xs text-destructive">{errors.visit_date.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-cap">Daily Capacity *</Label>
            <Input id="ed-cap" type="number" min={1} {...register('daily_capacity')} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ed-open"
              checked={isOpenValue}
              onCheckedChange={(v) => setValue('is_open', Boolean(v))}
            />
            <Label htmlFor="ed-open" className="cursor-pointer">Open for ticketing</Label>
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

export function EntryDaysPage() {
  const { data, isLoading, error } = useGetEntryDaysQuery({});
  const [formOpen, setFormOpen] = useState(false);
  const [editDay, setEditDay] = useState<EntryDay | null>(null);

  function openCreate() { setEditDay(null); setFormOpen(true); }
  function openEdit(d: EntryDay) { setEditDay(d); setFormOpen(true); }

  return (
    <div>
      <PageHeader
        title="Entry Days"
        description="Manage open days and capacity"
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> Add Day</Button>}
      />
      {error && <ErrorDisplay error={error} />}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Visit Date</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No entry days configured</TableCell>
              </TableRow>
            ) : (
              data?.results.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{formatDate(d.visit_date)}</TableCell>
                  <TableCell className="text-right">{d.daily_capacity}</TableCell>
                  <TableCell><StatusBadge status={d.is_open ? 'open' : 'closed'} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <EntryDayDialog open={formOpen} onOpenChange={setFormOpen} day={editDay} />
    </div>
  );
}
