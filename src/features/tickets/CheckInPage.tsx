import { useState } from 'react';
import { ScanLine, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useCheckInByCodeMutation } from '@/api/apiSlice';
import { formatDate } from '@/utils/format';
import type { Ticket } from '@/types';

export function CheckInPage() {
  const [code, setCode] = useState('');
  const [lastResult, setLastResult] = useState<{ success: boolean; ticket?: Ticket; message?: string } | null>(null);
  const [checkIn, { isLoading }] = useCheckInByCodeMutation();

  async function handleCheckIn() {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return;
    try {
      const ticket = await checkIn({ code: trimmedCode }).unwrap();
      setLastResult({ success: true, ticket });
      setCode('');
    } catch (err: unknown) {
      const apiErr = err as { data?: { detail?: string } };
      setLastResult({
        success: false,
        message: apiErr.data?.detail ?? 'Check-in failed. Ticket may be invalid or already used.',
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); void handleCheckIn(); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Check In" description="Scan or enter ticket code to check in" />

      {/* Code Input */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-base font-medium">Ticket Code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="Enter ticket code…"
                className="font-mono text-lg h-12 tracking-widest"
                autoFocus
                autoComplete="off"
              />
              <Button
                onClick={handleCheckIn}
                disabled={isLoading || !code.trim()}
                className="h-12 px-6"
              >
                <ScanLine className="h-4 w-4 mr-2" />
                {isLoading ? 'Checking…' : 'Check In'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Press Enter to check in quickly</p>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {lastResult && (
        <Card className={`border-2 ${lastResult.success ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
          <CardContent className="pt-6">
            {lastResult.success && lastResult.ticket ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-green-800 text-lg">Check-in Successful!</span>
                </div>
                <div className="bg-white rounded-md p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-mono font-semibold">{lastResult.ticket.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Type</span>
                    <span className="font-medium">{lastResult.ticket.ticket_type_name ?? `#${lastResult.ticket.ticket_type}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visit Date</span>
                    <span className="font-medium">{formatDate(lastResult.ticket.visit_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={lastResult.ticket.status} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                <span className="font-medium text-red-800">{lastResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
