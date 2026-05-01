import type { EntityDetailWidget, EntityWidgetCatalog } from '../provider/widget-catalog.js';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Standard detail-widget catalog (read-mode formatters).
//
// Mirrors the form-widget id set so a field declaring widget="text" in
// the manifest renders through the matching detail formatter without
// extra wiring. Apps that want richer rendering (currency, locale-aware
// dates) register their own widgets via the same key namespace and
// override at the provider level.
//
// Widgets stay unstyled — they emit minimal markup with `data-granit-*`
// attributes so the host app can style them with the rest of its
// EntityDetail tree.
// ---------------------------------------------------------------------------

const TextDetailWidget: EntityDetailWidget = ({ value }) => formatText(value);

const BooleanDetailWidget: EntityDetailWidget = ({ value }) => {
  if (value === null || value === undefined) return EMPTY_DASH;
  return value ? '✓' : '✗';
};

const UrlDetailWidget: EntityDetailWidget = ({ value, propertyName }) => {
  if (value === null || value === undefined || value === '') return EMPTY_DASH;
  const href = String(value);
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <a
      data-granit-detail-link=""
      data-property={propertyName}
      data-external={isExternal ? '' : undefined}
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {href}
    </a>
  );
};

const EmailDetailWidget: EntityDetailWidget = ({ value, propertyName }) => {
  if (value === null || value === undefined || value === '') return EMPTY_DASH;
  const address = String(value);
  return (
    <a
      data-granit-detail-link=""
      data-property={propertyName}
      data-scheme="mailto"
      href={`mailto:${address}`}
    >
      {address}
    </a>
  );
};

const TelDetailWidget: EntityDetailWidget = ({ value, propertyName }) => {
  if (value === null || value === undefined || value === '') return EMPTY_DASH;
  const number = String(value);
  // tel: URIs ignore most non-digit chars but accept '+', '-', spaces.
  // We surface the raw value so screen readers / dialers handle it; the
  // displayed label is the same string.
  return (
    <a
      data-granit-detail-link=""
      data-property={propertyName}
      data-scheme="tel"
      href={`tel:${number.replace(/\s+/g, '')}`}
    >
      {number}
    </a>
  );
};

const EMPTY_DASH = '—';

function formatText(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_DASH;
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Standard detail-widget catalog. Pass it to
 * `<EntityRendererProvider widgets={{ form, detail: STANDARD_DETAIL_WIDGETS.detail }}>`
 * to get URL / email / tel / boolean formatting out of the box. Apps
 * spread + override entries they want to customise:
 *
 * ```tsx
 * <EntityRendererProvider widgets={{
 *   form: STANDARD_FORM_WIDGETS.form,
 *   detail: { ...STANDARD_DETAIL_WIDGETS.detail, currency: MyCurrencyWidget },
 * }}>
 * ```
 *
 * Widget keys mirror the form-widget catalog ids so a field declaring
 * `widget: 'text'` in the manifest reuses the same string in both
 * contexts.
 */
export const STANDARD_DETAIL_WIDGETS: EntityWidgetCatalog = Object.freeze({
  form: Object.freeze({}),
  detail: Object.freeze({
    text: TextDetailWidget,
    textarea: TextDetailWidget,
    integer: TextDetailWidget,
    decimal: TextDetailWidget,
    boolean: BooleanDetailWidget,
    date: TextDetailWidget,
    time: TextDetailWidget,
    datetime: TextDetailWidget,
    url: UrlDetailWidget,
    email: EmailDetailWidget,
    tel: TelDetailWidget,
  }) as Readonly<Record<string, EntityDetailWidget>>,
});

/** Default formatter used by `<EntityDetail />` when no widget is registered. */
export function defaultDetailFormat(value: unknown): ReactNode {
  return formatText(value);
}
