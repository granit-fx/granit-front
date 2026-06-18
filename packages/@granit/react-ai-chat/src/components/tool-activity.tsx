import { cn } from '@granit/utils';
import { Check, Loader2, X } from 'lucide-react';

import { defaultChatLabels } from '../locales/index';

import type { ToolCallActivity, ToolCallStatus } from '../hooks/use-chat-stream';
import type { ChatTranslations } from '../locales/index';

export interface ToolActivityProps {
  /**
   * Tools invoked this turn, in start order, keyed by `toolCallId`
   * (from `useChatStream().toolCalls`).
   */
  readonly toolCalls: readonly ToolCallActivity[];
  /**
   * Whether to show the derived "thinking" indicator
   * (`useChatStream().isThinking`): a tool finished and the next step is pending.
   */
  readonly isThinking?: boolean;
  readonly labels?: ChatTranslations['Tools'];
  /**
   * Map a backend tool name to its display label. Defaults to
   * `labels.Names[toolName] ?? labels.Fallback` — override to localize app tools
   * without editing the shared `Names` map.
   */
  readonly resolveToolLabel?: (toolName: string) => string;
  readonly className?: string;
}

const STATUS_ICON: Record<ToolCallStatus, typeof Loader2> = {
  running: Loader2,
  succeeded: Check,
  failed: X,
};

/**
 * Renders the agent's live tool activity as Claude-style chips: a spinner while
 * a tool runs, resolving to ✓/✗ when its `tool_result` arrives. Below the chips,
 * a derived "thinking" line shows when a tool has finished but no answer text has
 * resumed yet. The chips carry **only** the tool's localized name — never its
 * arguments or result (the wire omits both). Renders nothing when idle.
 */
export function ToolActivity({
  toolCalls,
  isThinking = false,
  labels = defaultChatLabels.Tools,
  resolveToolLabel,
  className,
}: Readonly<ToolActivityProps>) {
  if (toolCalls.length === 0 && !isThinking) return null;

  const labelFor = (toolName: string): string =>
    resolveToolLabel?.(toolName) ?? labels.Names[toolName] ?? labels.Fallback;

  return (
    <div data-slot="tool-activity" className={cn('flex flex-col gap-1.5', className)}>
      {toolCalls.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {toolCalls.map((tool) => {
            const Icon = STATUS_ICON[tool.status];
            const label = labelFor(tool.toolName);
            const statusWord =
              tool.status === 'succeeded'
                ? labels.Succeeded
                : tool.status === 'failed'
                  ? labels.Failed
                  : null;
            return (
              <li key={tool.toolCallId}>
                <span
                  data-slot="tool-chip"
                  data-status={tool.status}
                  aria-label={statusWord ? `${label} — ${statusWord}` : label}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
                    tool.status === 'failed'
                      ? 'border-destructive/40 text-destructive'
                      : 'border-border bg-muted text-muted-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-3.5',
                      tool.status === 'running' && 'animate-spin',
                      tool.status === 'succeeded' && 'text-green-600 dark:text-green-500'
                    )}
                    aria-hidden
                  />
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {isThinking ? (
        <div
          data-slot="tool-thinking"
          className="text-muted-foreground flex items-center gap-1.5 text-xs"
        >
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {labels.Thinking}
        </div>
      ) : null}
    </div>
  );
}
