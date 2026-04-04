import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { ApiError } from '@/types';

interface ErrorDisplayProps {
  error: unknown;
}

export function extractMessage(error: unknown): string {
  if (!error) return 'An error occurred.';
  const apiError = error as ApiError;
  const data = apiError.data;

  if (typeof data !== 'object' || data === null) return 'An unexpected error occurred.';

  // Unwrap the API envelope: { success, message, errors }
  const errors = ('errors' in data && typeof data.errors === 'object' && data.errors !== null)
    ? data.errors as unknown as Record<string, unknown>
    : data;

  // Simple detail string
  if ('detail' in errors) {
    const detail = errors.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.join(', ');
  }

  // Field-level errors → human-readable list
  const lines = Object.entries(errors)
    .filter(([k]) => k !== 'detail')
    .map(([field, msgs]) => {
      const label = field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const text = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
      return `${label}: ${text}`;
    });

  if (lines.length > 0) return lines.join(' | ');

  // Fallback to top-level message
  if ('message' in data && typeof data.message === 'string') return data.message;

  return 'An unexpected error occurred.';
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Alert variant="destructive" className="animate-scale-in mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{extractMessage(error)}</AlertDescription>
    </Alert>
  );
}
