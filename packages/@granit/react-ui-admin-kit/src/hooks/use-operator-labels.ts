import { useTranslation } from '@granit/react-localization';
import { useMemo } from 'react';

/**
 * Returns translated operator labels for the smart filter bar.
 * Shared across every page that renders a query-driven data table.
 */
export function useOperatorLabels() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      Eq: t('Operators.Eq'),
      Contains: t('Operators.Contains'),
      StartsWith: t('Operators.StartsWith'),
      EndsWith: t('Operators.EndsWith'),
      Gt: t('Operators.Gt'),
      Gte: t('Operators.Gte'),
      Lt: t('Operators.Lt'),
      Lte: t('Operators.Lte'),
      In: t('Operators.In'),
      Between: t('Operators.Between'),
    }),
    [t]
  );
}
