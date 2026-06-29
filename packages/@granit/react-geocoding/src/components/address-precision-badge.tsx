'use client';

import { Badge } from '@granit/react-ui';
import { useTranslation } from 'react-i18next';

import { I18N_NAMESPACE } from '../constants';

import type { GeocodeMatchPrecision } from '@granit/geocoding';
import type { ComponentProps, ReactElement } from 'react';

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

const VARIANT_BY_PRECISION: Record<GeocodeMatchPrecision, BadgeVariant> = {
  Rooftop: 'default',
  Street: 'secondary',
  Locality: 'outline',
};

export interface AddressPrecisionBadgeProps {
  /** The match granularity returned by the reverse-geocoding endpoint. */
  readonly precision: GeocodeMatchPrecision;
  readonly className?: string;
}

/**
 * Read-only badge surfacing how precisely an address was geocoded — e.g.
 * "Exact location" (rooftop) vs "Approximate location" (locality centroid).
 * Fed by the `precision` of a {@link useReverseGeocode} result; the label comes
 * from the `geocoding` i18n namespace, so user-facing copy stays brand-neutral.
 */
export function AddressPrecisionBadge({
  precision,
  className,
}: AddressPrecisionBadgeProps): ReactElement {
  const { t } = useTranslation(I18N_NAMESPACE);

  return (
    <Badge variant={VARIANT_BY_PRECISION[precision]} className={className}>
      {t(`Precision.${precision}`)}
    </Badge>
  );
}
