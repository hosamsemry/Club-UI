import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { ApiError } from '@/types';

interface ErrorDisplayProps {
  error: unknown;
}

function extractMessage(error: unknown): string {
  if (!error) return 'An error occurred.';
  const apiError = error as ApiError;
  if (typeof apiError.data === 'object' && apiError.data !== null) {
    if ('detail' in apiError.data) return String(apiError.data.detail);
    const messages = Object.entries(apiError.data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' | ');
    if (messages) return messages;
  }
  return 'An unexpected error occurred.';
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{extractMessage(error)}</AlertDescription>
    </Alert>
  );
}
