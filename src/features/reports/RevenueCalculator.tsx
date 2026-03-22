import { useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useLazyGetRevenueQuery } from '@/api/apiSlice';
import { formatCurrency } from '@/utils/format';
import type { RevenueField } from '@/types';
import { toast } from 'sonner';

const FIELD_OPTIONS: { value: RevenueField; label: string }[] = [
  { value: 'products', label: 'Products' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'events', label: 'Events' },
];

export function RevenueCalculator() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFields, setSelectedFields] = useState<RevenueField[]>([]);
  const [trigger, { data, isLoading, error }] = useLazyGetRevenueQuery();

  function toggleField(field: RevenueField) {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  }

  async function handleCalculate() {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (selectedFields.length === 0) {
      toast.error('Please select at least one revenue field');
      return;
    }
    if (startDate > endDate) {
      toast.error('Start date must be on or before end date');
      return;
    }
    try {
      await trigger({ start_date: startDate, end_date: endDate, fields: selectedFields }).unwrap();
    } catch {
      toast.error('Failed to calculate revenue');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Revenue Calculator
        </CardTitle>
        <CardDescription>
          Select a date range and one or more categories to calculate total revenue
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date range row */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {/* Field selection */}
        <div className="space-y-2">
          <Label className="text-xs">Revenue Categories</Label>
          <div className="flex flex-wrap gap-4">
            {FIELD_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <Checkbox
                  checked={selectedFields.includes(opt.value)}
                  onCheckedChange={() => toggleField(opt.value)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Calculate button */}
        <Button onClick={handleCalculate} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? 'Calculating…' : 'Calculate Revenue'}
        </Button>

        {/* Error */}
        {error && <ErrorDisplay error={error} />}

        {/* Results */}
        {data && !isLoading && (
          <div className="mt-2 rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              {data.start_date} &mdash; {data.end_date}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.products !== undefined && (
                <div className="rounded-md bg-card p-3 ring-1 ring-foreground/5">
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-lg font-semibold">{formatCurrency(data.products)}</p>
                </div>
              )}
              {data.tickets !== undefined && (
                <div className="rounded-md bg-card p-3 ring-1 ring-foreground/5">
                  <p className="text-xs text-muted-foreground">Tickets</p>
                  <p className="text-lg font-semibold">{formatCurrency(data.tickets)}</p>
                </div>
              )}
              {data.events !== undefined && (
                <div className="rounded-md bg-card p-3 ring-1 ring-foreground/5">
                  <p className="text-xs text-muted-foreground">Events</p>
                  <p className="text-lg font-semibold">{formatCurrency(data.events)}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Total Revenue</span>
              <span className="ml-auto text-xl font-bold text-primary">
                {formatCurrency(data.total_revenue)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
