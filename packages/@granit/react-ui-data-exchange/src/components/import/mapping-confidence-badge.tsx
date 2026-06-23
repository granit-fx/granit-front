import { Badge } from '@granit/react-ui';

import type { MappingConfidence } from '@granit/data-exchange';

export interface MappingConfidenceBadgeProps {
  readonly confidence: MappingConfidence;
}

const CONFIDENCE_VARIANTS: Record<MappingConfidence, 'default' | 'secondary' | 'outline'> = {
  Manual: 'outline',
  Saved: 'default',
  Exact: 'default',
  Fuzzy: 'secondary',
  Semantic: 'secondary',
};

const CONFIDENCE_LABELS: Record<MappingConfidence, string> = {
  Manual: 'Manual',
  Saved: 'Saved',
  Exact: 'Exact match',
  Fuzzy: 'Fuzzy match',
  Semantic: 'Semantic',
};

/**
 * Badge showing the confidence level of a column mapping.
 */
export function MappingConfidenceBadge({ confidence }: MappingConfidenceBadgeProps) {
  return (
    <Badge
      data-slot="mapping-confidence-badge"
      variant={CONFIDENCE_VARIANTS[confidence]}
      className="text-xs"
    >
      {CONFIDENCE_LABELS[confidence]}
    </Badge>
  );
}
