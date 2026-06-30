import { usePartyDuplicateCandidatesForPartyQuery } from '@granit/react-parties';
import { Badge } from '@granit/react-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { PartyId } from '@granit/parties';

const PARTIES_NAMESPACE = 'parties';

export interface PartyDuplicatesBadgeProps {
  /** Party whose pending candidate pairs we surface. */
  readonly partyId: PartyId;
  /**
   * URL to navigate to on click. Typically the duplicates inbox URL with a
   * filter applied to this party — `/admin/parties/duplicates?filter=…`.
   * When omitted, the badge renders as a plain pill.
   */
  readonly href?: string;
  /** Optional className appended to the pill — for theme integration. */
  readonly className?: string;
}

/**
 * Small inline pill that surfaces the count of pending duplicate candidates
 * involving a given party. Hidden when the party has no candidates (or while
 * the query is still loading) to keep the detail page calm.
 *
 * Uses the `destructive` Badge variant when at least one pair carries a
 * non-Fuzzy (stronger) signal; the muted `secondary` variant otherwise.
 */
export function PartyDuplicatesBadge({
  partyId,
  href,
  className,
}: Readonly<PartyDuplicatesBadgeProps>) {
  const { t } = useTranslation(PARTIES_NAMESPACE);
  const query = usePartyDuplicateCandidatesForPartyQuery(partyId);

  const candidates = query.data ?? [];
  const pending = candidates.filter((c) => c.dismissedAt == null);

  if (pending.length === 0) return null;

  const hasNonFuzzy = pending.some((c) => c.tier !== 'Fuzzy');
  const tone = hasNonFuzzy ? 'amber' : 'muted';

  const label = t('Duplicates.Badge.PerParty', {
    count: pending.length,
    defaultValue: 'Potential duplicates ({{count}})',
  });

  const badge = (
    <Badge
      data-slot="party-duplicates-badge"
      data-tone={tone}
      variant={hasNonFuzzy ? 'destructive' : 'secondary'}
      className={className}
    >
      {label}
    </Badge>
  );

  return href ? <Link to={href}>{badge}</Link> : badge;
}
