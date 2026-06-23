import { useTranslation } from '@granit/react-localization';
import { TaxonomySearchBar } from '@granit/react-taxonomy';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { TAXONOMY_TARGET_TYPES } from '../constants';

import type { TaxonomySearchResultItem } from '@granit/taxonomy';

const ROUTE_BY_TARGET_TYPE: Readonly<Record<string, (id: string) => string>> = {
  [TAXONOMY_TARGET_TYPES.Document]: (id) => `/documents/${id}`,
  [TAXONOMY_TARGET_TYPES.Party]: (id) => `/parties/${id}`,
};

/**
 * Header-mounted variant of `<TaxonomySearchBar />`. Hosts the cross-entity
 * taxonomy search next to the notification bell. On selection, navigates to
 * the matching entity-detail route. Falls back silently when no route is
 * registered for the target type.
 */
export function TaxonomyHeaderSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const targetTypeLabels = useMemo(
    () => ({
      [TAXONOMY_TARGET_TYPES.Document]: t('taxonomy:Search.TargetType.Document', 'Documents'),
      [TAXONOMY_TARGET_TYPES.Party]: t('taxonomy:Search.TargetType.Party', 'Parties'),
    }),
    [t]
  );

  function handleSelect(item: TaxonomySearchResultItem): void {
    const route = ROUTE_BY_TARGET_TYPE[item.targetType];
    if (route) navigate(route(item.targetId));
  }

  return (
    <TaxonomySearchBar
      onSelect={handleSelect}
      targetTypeLabels={targetTypeLabels}
      labels={{
        placeholder: t('taxonomy:Search.Placeholder', 'Search by tag or category…'),
        belowThreshold: t('taxonomy:Search.BelowThreshold', 'Type at least 2 characters'),
        empty: t('taxonomy:Search.Empty', 'No results.'),
        loading: t('taxonomy:Search.Loading', 'Searching…'),
        error: t('taxonomy:Search.Error', 'Search failed.'),
      }}
      className="hidden w-64 lg:block"
    />
  );
}
