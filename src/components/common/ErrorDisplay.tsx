import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { extractErrorDetails } from '@/utils/error';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: unknown;
  className?: string;
}

export function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  if (!error) return null;
  const details = extractErrorDetails(error);
  if (!details.message) return null;

  const fieldEntries = Object.entries(details.fieldErrors);

  return (
    <Alert variant="destructive" className={cn("animate-scale-in mb-4", className)}>
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="space-y-1.5 flex-1 min-w-0">
        <AlertDescription className="font-medium break-words">{details.message}</AlertDescription>
        {fieldEntries.length > 1 && (
          <ul className="mt-1.5 list-disc list-inside text-xs space-y-1 opacity-90">
            {fieldEntries.map(([field, msg]) => (
              <li key={field} className="break-words">
                <span className="font-semibold capitalize">{field.replace(/_/g, ' ')}</span>: {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Alert>
  );
}
