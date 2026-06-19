import { cn } from '@granit/utils';

import { defaultChatLabels } from '../locales/index';

import type { ChatTurnMetrics } from '../hooks/use-chat-stream';
import type { ChatTranslations } from '../locales/index';

export interface MessageMetricsProps {
  /** Timing for the turn, from `useChatStream().metrics`. */
  readonly metrics: ChatTurnMetrics;
  readonly labels?: ChatTranslations['Metrics'];
  readonly className?: string;
}

const formatMs = (ms: number): string => `${Math.round(ms)}ms`;

const PLACEHOLDER = '—';

/**
 * A compact timing chip showing the turn's total duration, revealing the full
 * breakdown (time-to-first-token, total, tokens/sec, chunk count) in a popover
 * on hover or keyboard focus. Pure CSS disclosure — no popover library — to
 * match the package's dependency-free chip style. The trigger is a real
 * `<button>` so the breakdown is reachable by keyboard and screen readers.
 */
export function MessageMetrics({
  metrics,
  labels = defaultChatLabels.Metrics,
  className,
}: Readonly<MessageMetricsProps>) {
  const { firstTokenMs, totalMs, tokensPerSecond, chunkCount } = metrics;
  const rows: ReadonlyArray<{ readonly label: string; readonly value: string }> = [
    { label: labels.FirstToken, value: formatMs(firstTokenMs) },
    { label: labels.Total, value: formatMs(totalMs) },
    {
      label: labels.Speed,
      value: tokensPerSecond === null ? PLACEHOLDER : `${tokensPerSecond.toFixed(1)} tok/s`,
    },
    { label: labels.Chunks, value: String(chunkCount) },
  ];

  return (
    <span
      data-slot="message-metrics"
      className={cn('group/metrics relative inline-flex', className)}
    >
      <button
        type="button"
        data-slot="message-metrics-trigger"
        aria-label={labels.Label}
        className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-1.5 py-0.5 text-xs tabular-nums transition-colors"
      >
        {formatMs(totalMs)}
      </button>
      <span
        role="tooltip"
        data-slot="message-metrics-popover"
        className="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden w-max min-w-40 flex-col gap-1 rounded-md border p-2 text-xs shadow-md group-hover/metrics:flex group-focus-within/metrics:flex"
      >
        {rows.map((row) => (
          <span key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium tabular-nums">{row.value}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
