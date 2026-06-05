'use client';

import { stringifyLookupValue } from '@granit/data-lookup';

import { useLookupResolve } from '../hooks/use-lookup-resolve';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor } from '@granit/data-lookup';
import type { ReactElement } from 'react';

/** Render-prop signature. */
export interface LookupBadgeRenderArgs {
  readonly label: string;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export interface LookupBadgeProps {
  readonly descriptor: LookupDescriptor;
  readonly value: unknown;
  /** Axios instance used by the underlying hook. Falls back to {@link DataLookupProvider}. */
  readonly client?: AxiosInstance;
  readonly culture?: string;
  readonly basePath?: string;
  /**
   * Optional fallback label used while loading or when the value cannot be
   * resolved. Defaults to `String(value)`.
   */
  readonly fallback?: string;
  readonly render?: (args: LookupBadgeRenderArgs) => ReactElement;
}

/**
 * Read-only projection of a lookup value. Uses {@link useLookupResolve} to
 * fetch the localized label; shows the raw value (or a caller-provided
 * fallback) while loading or on error.
 *
 * Suitable for:
 * - Detail views where a foreign-key id is stored but a label is displayed.
 * - Activity logs / audit tables.
 * - Read-only form fields.
 */
export function LookupBadge(props: LookupBadgeProps): ReactElement {
  const { descriptor, value, client, culture, basePath, fallback, render } = props;
  const query = useLookupResolve(descriptor, value, { client, basePath, culture });

  const rawFallback = fallback ?? stringifyLookupValue(value);
  const label = query.data?.label ?? rawFallback;

  if (render) {
    return render({ label, isLoading: query.isLoading, isError: query.isError });
  }

  return <span data-lookup-badge>{label}</span>;
}
