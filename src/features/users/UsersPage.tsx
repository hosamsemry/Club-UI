import { useState } from 'react';
import { Plus, Search, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { BooleanBadge, StatusBadge } from '@/components/common/StatusBadge';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { UserFormSheet } from './UserFormSheet';
import { useGetClubUsersQuery } from '@/api/apiSlice';
import { ROLE_LABELS } from '@/utils/roles';
import { formatDate } from '@/utils/format';
import type { ClubUser } from '@/types';

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<ClubUser | null>(null);

  const params: Record<string, string> = { page: String(page) };
  if (search) params['search'] = search;

  const { data, isLoading, error } = useGetClubUsersQuery(params);
  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  function openCreate() {
    setEditUser(null);
    setFormOpen(true);
  }

  function openEdit(user: ClubUser) {
    setEditUser(user);
    setFormOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage club members and their roles"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Add User
          </Button>
        }
      />

      {error && <ErrorDisplay error={error} />}

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-64"
            placeholder="Search by email or username…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-none animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.username}</TableCell>
                  <TableCell>
                    <StatusBadge status={ROLE_LABELS[user.role]} />
                  </TableCell>
                  <TableCell>
                    <BooleanBadge value={user.is_active} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.date_joined)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} users</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm px-3 py-2">Page {page} of {totalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <UserFormSheet open={formOpen} onOpenChange={setFormOpen} user={editUser} />
    </div>
  );
}
