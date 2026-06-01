import { useTranslation } from 'react-i18next';

import { usePartyDuplicateCandidatesForPartyQuery } from '../hooks/use-party-duplicates';

import type { PartyId } from '@granit/parties';
import type { ReactNode } from 'react';

const PARTIES_NAMESPACE = 'parties';

export interface PartyDuplicatesBadgeProps {
  /** Party whose pending candidate pairs we surface. */
  readonly partyId: PartyId;
  /**
   * URL to navigate to on click. Typically the duplicates inbox URL with a
   * filter applied to this party — `/admin/parties/duplicates?filter=…`.
   * When omitted, the badge renders as a plain `<span>`.
   */
  readonly href?: string;
  /** Optional render-prop wrapper (consumer-supplied router `<Link>` etc.). */
  readonly renderLink?: (props: { href: string; children: ReactNode }) => ReactNode;
  /** Optional className appended to the pill — for theme integration. */
  readonly className?: string;
}

/**
 * Small inline pill that surfaces the count of pending duplicate candidates
 * involving a given party. Hidden when the party has no candidates (or while
 * the query is still loading) to keep the detail page calm.
 *
 * Coloured amber when at least one pair contains a non-Fuzzy (i.e. stronger)
 * signal; muted gray when only Tier-3 fuzzy pairs are present.
 */
export function PartyDuplicatesBadge({
  partyId,
  href,
  renderLink,
  className,
}: Readonly<PartyDuplicatesBadgeProps>) {
  const { t } = useTranslation(PARTIES_NAMESPACE);
  const query = usePartyDuplicateCandidatesForPartyQuery(partyId);

  const candidates = query.data ?? [];
  const pending = candidates.filter((c) => c.dismissedAt == null);

  if (pending.length === 0) return null;

  const hasNonFuzzy = pending.some((c) => c.tier !== 'Fuzzy');
  const tone = hasNonFuzzy
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-muted text-muted-foreground border-border';

  const label = t('Duplicates.Badge.PerParty', {
    count: pending.length,
    defaultValue: 'Potential duplicates ({{count}})',
  });

  const pillClass = [
    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
    tone,
    className ?? '',
  ]
    .join(' ')
    .trim();

  if (href) {
    if (renderLink) {
      return renderLink({
        href,
        children: (
          <span
            data-slot="party-duplicates-badge"
            data-tone={hasNonFuzzy ? 'amber' : 'muted'}
            className={pillClass}
          >
            {label}
          </span>
        ),
      });
    }
    return (
      <a
        data-slot="party-duplicates-badge"
        data-tone={hasNonFuzzy ? 'amber' : 'muted'}
        href={href}
        className={pillClass}
      >
        {label}
      </a>
    );
  }

  return (
    <span
      data-slot="party-duplicates-badge"
      data-tone={hasNonFuzzy ? 'amber' : 'muted'}
      className={pillClass}
    >
      {label}
    </span>
  );
}
