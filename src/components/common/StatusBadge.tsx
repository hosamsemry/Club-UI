import { Badge } from '@/components/ui/badge';
import type { ReservationStatus, TicketStatus } from '@/types';

interface StatusBadgeProps {
  status: ReservationStatus | TicketStatus | string;
}

const CONFIG: Record<string, { label: string; className: string; dot?: string }> = {
  // Reservation statuses
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200/60', dot: 'bg-amber-500' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200/60', dot: 'bg-blue-500' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200/60' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200/60', dot: 'bg-green-500' },
  // Ticket statuses
  valid: { label: 'Valid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
  checked_in: { label: 'Checked In', className: 'bg-teal-50 text-teal-700 border-teal-200/60', dot: 'bg-teal-500' },
  voided: { label: 'Voided', className: 'bg-gray-50 text-gray-500 border-gray-200/60' },
  // Boolean-like
  active: { label: 'Active', className: 'bg-green-50 text-green-700 border-green-200/60', dot: 'bg-green-500' },
  inactive: { label: 'Inactive', className: 'bg-gray-50 text-gray-500 border-gray-200/60' },
  open: { label: 'Open', className: 'bg-blue-50 text-blue-700 border-blue-200/60', dot: 'bg-blue-500' },
  closed: { label: 'Closed', className: 'bg-gray-50 text-gray-500 border-gray-200/60' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = CONFIG[status] ?? { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200/60' };
  return (
    <Badge variant="outline" className={`font-medium text-xs gap-1.5 ${config.className}`}>
      {config.dot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      )}
      {config.label}
    </Badge>
  );
}

export function BooleanBadge({ value }: { value: boolean }) {
  return <StatusBadge status={value ? 'active' : 'inactive'} />;
}
