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
import { useCreateClubUserMutation, useUpdateClubUserMutation } from '@/api/apiSlice';
import { ROLE_LABELS } from '@/utils/roles';
import { useAppSelector } from '@/app/hooks';
import type { ClubUser, UserRole } from '@/types';
import { toast } from 'sonner';

// Roles a manager can assign (cannot create owners)
const ASSIGNABLE_ROLES_BY_ROLE: Record<string, UserRole[]> = {
  owner: ['owner', 'manager', 'cashier', 'staff'],
  manager: ['manager', 'cashier', 'staff'],
};

const createSchema = z.object({
  email: z.string().email('Valid email required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().min(1, 'Role is required'),
});

const editSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  is_active: z.boolean(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: ClubUser | null;
}

export function UserFormSheet({ open, onOpenChange, user }: Props) {
  const isEdit = !!user;
  const myRole = useAppSelector((s) => s.auth.role) ?? 'manager';
  const assignableRoles = ASSIGNABLE_ROLES_BY_ROLE[myRole] ?? ['cashier', 'staff'];

  const [createUser, { isLoading: creating, error: createError }] = useCreateClubUserMutation();
  const [updateUser, { isLoading: updating, error: updateError }] = useUpdateClubUserMutation();
  const isSaving = creating || updating;
  const error = createError ?? updateError;

  // ── Create form ────────────────────────────────────────────────────
  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema) as never,
    defaultValues: { role: 'cashier' },
  });

  // ── Edit form ──────────────────────────────────────────────────────
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema) as never,
    defaultValues: { role: 'cashier', is_active: true },
  });

  useEffect(() => {
    if (isEdit && user) {
      editForm.reset({ role: user.role, is_active: user.is_active });
    } else {
      createForm.reset({ role: 'cashier' });
    }
  }, [user, isEdit, open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onCreateSubmit(values: CreateValues) {
    try {
      await createUser(values).unwrap();
      toast.success('User created');
      onOpenChange(false);
    } catch {
      // shown via ErrorDisplay
    }
  }

  async function onEditSubmit(values: EditValues) {
    if (!user) return;
    try {
      await updateUser({ id: user.id, ...values }).unwrap();
      toast.success('User updated');
      onOpenChange(false);
    } catch {
      // shown via ErrorDisplay
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>{isEdit ? 'Edit User' : 'Create User'}</SheetTitle>
        </SheetHeader>

        {error && <div className="mb-4"><ErrorDisplay error={error} /></div>}

        {isEdit ? (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 p-1.5 lg:p-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Role *</Label>
              <Select
                onValueChange={(v) => v && editForm.setValue('role', v)}
                value={editForm.watch('role')}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editForm.formState.errors.role && (
                <p className="text-xs text-destructive">{editForm.formState.errors.role.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={editForm.watch('is_active')}
                onCheckedChange={(v) => editForm.setValue('is_active', Boolean(v))}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            </div>

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button>
            </SheetFooter>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 p-1.5 lg:p-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...createForm.register('email')} placeholder="user@example.com" />
              {createForm.formState.errors.email && (
                <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username *</Label>
              <Input id="username" {...createForm.register('username')} placeholder="johndoe" />
              {createForm.formState.errors.username && (
                <p className="text-xs text-destructive">{createForm.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" {...createForm.register('password')} placeholder="Min. 6 characters" />
              {createForm.formState.errors.password && (
                <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role *</Label>
              <Select
                onValueChange={(v) => v && createForm.setValue('role', v)}
                value={createForm.watch('role')}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.formState.errors.role && (
                <p className="text-xs text-destructive">{createForm.formState.errors.role.message}</p>
              )}
            </div>

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Creating…' : 'Create User'}</Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
