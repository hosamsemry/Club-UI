import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { ROLE_LABELS } from '@/utils/roles';
import type { UserRole } from '@/types';

export function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { email, role } = useAppSelector((s) => s.auth);

  const initials = email ? email.slice(0, 2).toUpperCase() : 'CM';

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  return (
    <header className="h-14 flex items-center border-b border-border/50 bg-card/90 glass px-4 gap-3 shrink-0 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_2px_8px_-4px_rgba(0,0,0,0.06)]">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-md p-1.5 transition-all duration-200" />
      <Separator orientation="vertical" className="h-5 opacity-30" />
      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-accent/80 transition-all duration-200 outline-none press group"
        >
          <Avatar className="h-7 w-7 ring-2 ring-border/60 transition-all duration-300 group-hover:ring-primary/30 group-hover:shadow-[0_0_0_4px_rgba(16,163,127,0.08)]">
            <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium text-foreground leading-none">{email ?? 'User'}</p>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
              {role ? ROLE_LABELS[role as UserRole] : ''}
            </p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 shadow-lg border-border/60">
          <DropdownMenuItem disabled>
            <User className="h-4 w-4 mr-2" />
            {email ?? 'Profile'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
