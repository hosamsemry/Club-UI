import { Badge } from '@/components/ui/badge';
import type { ReservationStatus, TicketStatus } from '@/types';

interface StatusBadgeProps {
  status: ReservationStatus | TicketStatus | string;
}

const CONFIG: Record<string, { label: string; className: string }> = {
  // Reservation statuses
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
  // Ticket statuses
  valid: { label: 'Valid', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  checked_in: { label: 'Checked In', className: 'bg-teal-100 text-teal-800 border-teal-200' },
  voided: { label: 'Voided', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  // Boolean-like
  active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  open: { label: 'Open', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <Badge variant="outline" className={`font-medium text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}

export function BooleanBadge({ value }: { value: boolean }) {
  return <StatusBadge status={value ? 'active' : 'inactive'} />;
}
