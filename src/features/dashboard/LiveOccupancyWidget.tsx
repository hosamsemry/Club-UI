import { Link } from 'react-router-dom';
import {
  Users,
  QrCode,
  Ticket,
  DoorOpen,
  DoorClosed,
  Activity,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '@/types';

interface LiveOccupancyWidgetProps {
  summary: DashboardSummary;
}

export function LiveOccupancyWidget({ summary }: LiveOccupancyWidgetProps) {
  const checkedIn = summary.today_checked_in_tickets_count ?? 0;
  const capacity = summary.today_capacity ?? null;
  const isOpen = summary.today_gate_is_open ?? true;
  const totalTickets = summary.today_total_tickets_count ?? summary.today_ticket_sales_count ?? 0;

  const hasCapacity = capacity !== null && capacity > 0;
  const percent = hasCapacity ? Math.min(100, Math.round((checkedIn / capacity) * 100)) : null;
  const remaining = hasCapacity ? Math.max(0, capacity - checkedIn) : null;
  const turnoutPercent = totalTickets > 0 ? Math.min(100, Math.round((checkedIn / totalTickets) * 100)) : null;

  // Status computation
  let statusBadge = {
    label: 'Smooth Flow',
    badgeClass: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30',
    ringColor: '#10B981',
    glowClass: 'neon-glow-emerald',
    description: 'Entry flowing steadily with plenty of headroom.',
  };

  if (!isOpen) {
    statusBadge = {
      label: 'Doors Closed',
      badgeClass: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30',
      ringColor: '#F43F5E',
      glowClass: 'neon-glow-rose',
      description: 'Gate entry is locked for today. Turnstiles inactive.',
    };
  } else if (percent === null) {
    statusBadge = {
      label: 'Open Admission',
      badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      ringColor: '#06B6D4',
      glowClass: 'neon-glow-cyan',
      description: 'No daily capacity cap set. Free admission flow.',
    };
  } else if (percent >= 90) {
    statusBadge = {
      label: 'Near Capacity',
      badgeClass: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30',
      ringColor: '#F43F5E',
      glowClass: 'neon-glow-rose',
      description: 'Venue is near peak capacity. Slow admission recommended.',
    };
  } else if (percent >= 70) {
    statusBadge = {
      label: 'High Volume',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      ringColor: '#F59E0B',
      glowClass: 'neon-glow-amber',
      description: 'Dance floor and lounges filling quickly.',
    };
  }

  // SVG Gauge Calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const gaugePercent = percent !== null ? percent : 100;
  const strokeDashoffset = circumference - (gaugePercent / 100) * circumference;

  return (
    <Card className="relative overflow-hidden border border-border/80 bg-card/80 glass-card backdrop-blur-xl mb-8 shadow-xl">
      {/* Top subtle nightlife ambient hairline accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent" />

      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left section: Live Title & Radial Progress Ring */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* SVG Circular Progress Gauge */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-muted/30 dark:stroke-white/10"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke={statusBadge.ringColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Gauge Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                {percent !== null ? (
                  <>
                    <span className="text-2xl font-black tracking-tight text-foreground leading-none">
                      {percent}%
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest mt-1">
                      Filled
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-black tracking-tight text-foreground leading-none">
                      {checkedIn}
                    </span>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest mt-1">
                      Inside
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Header info & Status Banner */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live Gate Control
                </span>
                <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-medium border ${statusBadge.badgeClass}`}>
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
                    style={{ backgroundColor: statusBadge.ringColor }}
                  />
                  {statusBadge.label}
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Venue Occupancy
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                {statusBadge.description}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link
              to="/tickets/check-in"
              className={cn(
                buttonVariants({ variant: 'default' }),
                'bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-md shadow-purple-600/25 transition-all duration-200 gap-2'
              )}
            >
              <QrCode className="h-4 w-4" />
              <span>Gate Scanner</span>
            </Link>

            <Link
              to="/tickets/sell"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'border-border/80 bg-background/50 hover:bg-accent/60 transition-all duration-200 gap-2'
              )}
            >
              <Ticket className="h-4 w-4" />
              <span>Sell Ticket</span>
            </Link>

            <Link
              to="/tickets/entry-days"
              title="Configure Daily Capacity"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              )}
            >
              <Settings2 className="h-4 w-4" />
              <span className="sr-only">Configure Daily Capacity</span>
            </Link>
          </div>
        </div>

        {/* Breakdown Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-border/60">
          {/* Inside Now */}
          <div className="p-3.5 rounded-xl bg-background/60 dark:bg-slate-900/40 border border-border/50 transition-all hover:border-purple-500/40">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[0.7rem] uppercase font-semibold tracking-wider">Inside Venue</span>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {checkedIn}
            </div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live on floor
            </p>
          </div>

          {/* Remaining Capacity */}
          <div className="p-3.5 rounded-xl bg-background/60 dark:bg-slate-900/40 border border-border/50 transition-all hover:border-purple-500/40">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[0.7rem] uppercase font-semibold tracking-wider">Remaining</span>
              <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {remaining !== null ? remaining : '∞'}
            </div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5 truncate">
              {hasCapacity ? `of ${capacity} limit` : 'Uncapped capacity'}
            </p>
          </div>

          {/* Turnout Scan Rate */}
          <div className="p-3.5 rounded-xl bg-background/60 dark:bg-slate-900/40 border border-border/50 transition-all hover:border-purple-500/40">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[0.7rem] uppercase font-semibold tracking-wider">Turnout Rate</span>
              <Ticket className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {turnoutPercent !== null ? `${turnoutPercent}%` : '—'}
            </div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5 truncate">
              {checkedIn} of {totalTickets} issued
            </p>
          </div>

          {/* Gate Access Status */}
          <div className="p-3.5 rounded-xl bg-background/60 dark:bg-slate-900/40 border border-border/50 transition-all hover:border-purple-500/40">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[0.7rem] uppercase font-semibold tracking-wider">Gate Door</span>
              {isOpen ? (
                <DoorOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <DoorClosed className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5 pt-0.5">
              {isOpen ? (
                <span className="text-emerald-600 dark:text-emerald-400">Open</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">Locked</span>
              )}
            </div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5">
              {isOpen ? 'Admissions accepting' : 'Admissions suspended'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}