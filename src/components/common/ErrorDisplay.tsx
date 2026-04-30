import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { extractMessage } from '@/utils/error';

interface ErrorDisplayProps {
  error: unknown;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Alert variant="destructive" className="animate-scale-in mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{extractMessage(error)}</AlertDescription>
    </Alert>
  );
}
