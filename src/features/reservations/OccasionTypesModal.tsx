import { useState } from 'react';
import { Plus, Check, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import {
  useGetOccasionTypesQuery,
  useCreateOccasionTypeMutation,
  useUpdateOccasionTypeMutation,
} from '@/api/apiSlice';
import { toast } from 'sonner';
import { extractMessage } from '@/utils/error';
import type { OccasionType } from '@/types';

interface OccasionTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OccasionTypesModal({ open, onOpenChange }: OccasionTypesModalProps) {
  const { data, isLoading, error } = useGetOccasionTypesQuery({});
  const [createOccasionType, { isLoading: creating, error: createError }] = useCreateOccasionTypeMutation();
  const [updateOccasionType, { isLoading: updating }] = useUpdateOccasionTypeMutation();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      await createOccasionType({ name, is_active: true }).unwrap();
      setNewName('');
      toast.success('Occasion type created');
    } catch (err: unknown) {
      toast.error(extractMessage(err) || 'Failed to create occasion type');
    }
  }

  async function handleUpdate(type: OccasionType) {
    const name = editingName.trim();
    if (!name || name === type.name) {
      setEditingId(null);
      return;
    }
    try {
      await updateOccasionType({ id: type.id, name }).unwrap();
      setEditingId(null);
      toast.success('Occasion type updated');
    } catch (err: unknown) {
      toast.error(extractMessage(err) || 'Failed to update occasion type');
    }
  }

  async function toggleActive(type: OccasionType) {
    try {
      await updateOccasionType({ id: type.id, is_active: !type.is_active }).unwrap();
      toast.success(`Occasion type ${type.is_active ? 'deactivated' : 'activated'}`);
    } catch (err: unknown) {
      toast.error(extractMessage(err) || 'Failed to change status');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Occasion Types</DialogTitle>
        </DialogHeader>

        {error && <ErrorDisplay error={error} />}
        {createError && <ErrorDisplay error={createError} />}

        <form onSubmit={handleCreate} className="flex gap-2 my-2">
          <Input
            placeholder="New occasion type name (e.g. Wedding, Birthday)…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={creating || !newName.trim()} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </form>

        <div className="rounded-lg border overflow-hidden mt-2 max-h-72 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : data?.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">
                    No occasion types yet. Add your first above.
                  </TableCell>
                </TableRow>
              ) : (
                data?.results.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">
                      {editingId === type.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            size={1}
                            className="h-7 text-xs"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-600"
                            onClick={() => void handleUpdate(type)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        type.name
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void toggleActive(type)}
                        className="cursor-pointer"
                        title="Click to toggle status"
                      >
                        <StatusBadge status={type.is_active ? 'active' : 'inactive'} />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(type.id);
                          setEditingName(type.name);
                        }}
                        disabled={updating}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
