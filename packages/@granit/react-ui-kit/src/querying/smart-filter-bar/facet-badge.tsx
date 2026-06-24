// ---------------------------------------------------------------------------
// FacetBadge — displays a filter token as a removable badge
// ---------------------------------------------------------------------------

import { Badge } from '@granit/react-ui';
import { XIcon } from 'lucide-react';

import type { FilterToken } from '@granit/query-engine';

export interface FacetBadgeProps {
  readonly token: FilterToken;
  readonly onRemove: (id: string) => void;
}

/**
 * Renders a filter token as a Badge with a remove button.
 *
 * For filter tokens with `labelParts`, the field, operator and value
 * are rendered with subtle visual differences.
 */
export function FacetBadge({ token, onRemove }: Readonly<FacetBadgeProps>) {
  return (
    <Badge
      variant="secondary"
      data-slot="facet-badge"
      data-token-type={token.type}
      className="gap-1 pr-1"
    >
      {token.type === 'filter' && token.labelParts ? (
        <span className="inline-flex items-baseline gap-1">
          <span className="font-semibold">{token.labelParts.field}</span>
          <span className="text-muted-foreground">{token.labelParts.operator}</span>
          <span>{token.labelParts.value}</span>
        </span>
      ) : (
        <span>{token.label}</span>
      )}
      <button
        type="button"
        aria-label={`Remove ${token.label}`}
        className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full hover:bg-muted"
        onClick={() => onRemove(token.id)}
      >
        <XIcon className="size-3" />
      </button>
    </Badge>
  );
}
