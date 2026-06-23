import { Tooltip, TooltipContent, TooltipTrigger } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { ShieldAlert } from 'lucide-react';

import type { RiskLabelStrings } from './use-risk-label-strings';
import type { UserSessionRiskLevel } from '@granit/identity';

/** Elevated risk levels worth surfacing — `None` renders nothing. */
type ElevatedRiskLevel = Exclude<UserSessionRiskLevel, 'None'>;

/**
 * Icon colour graded by severity — a yellow→orange→red ramp: light amber for
 * Low, deeper amber for Medium, destructive red for High. Colour only reinforces
 * the level, which is also spelled out in the accessible name and tooltip.
 */
const LEVEL_COLOR: Record<ElevatedRiskLevel, string> = {
  Low: 'text-warning-500',
  Medium: 'text-warning-600',
  High: 'text-destructive',
};

export interface SessionRiskIndicatorProps {
  readonly level: UserSessionRiskLevel | null;
  readonly reasons: readonly string[] | null;
  readonly labels: RiskLabelStrings;
}

/**
 * A graded warning icon shown on sessions the backend flagged as risky. Only
 * renders for `Low`/`Medium`/`High`; the reasons are exposed both as the icon's
 * accessible name (so screen readers and keyboard users get them without a
 * hover) and in a tooltip. Requires a `TooltipProvider` ancestor.
 */
export function SessionRiskIndicator({
  level,
  reasons,
  labels,
}: Readonly<SessionRiskIndicatorProps>) {
  if (level === null || level === 'None') return null;

  const reasonLabels = (reasons ?? []).map((code) => labels.reason(code));
  const heading = `${labels.title}: ${labels.level(level)}`;
  const accessibleName = reasonLabels.length ? `${heading}. ${reasonLabels.join(', ')}` : heading;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={accessibleName}
          className="inline-flex shrink-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ShieldAlert className={cn('h-3.5 w-3.5', LEVEL_COLOR[level])} />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{heading}</p>
        {reasonLabels.length > 0 && (
          <ul className="mt-1 list-disc pl-4">
            {reasonLabels.map((label, i) => (
              <li key={reasons?.[i] ?? label}>{label}</li>
            ))}
          </ul>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
