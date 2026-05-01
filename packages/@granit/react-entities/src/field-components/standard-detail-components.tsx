import type {
  EntityComponentCatalog,
  EntityDetailComponent,
} from '../provider/component-catalog.js';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Standard detail-component catalog (read-mode formatters).
//
// Mirrors the form-component id set so a field declaring
// component="text" in the manifest renders through the matching detail
// formatter without extra wiring. Apps that want richer rendering
// (currency, locale-aware dates) register their own components via the
// same key namespace and override at the provider level.
//
// Components stay unstyled — they emit minimal markup with
// `data-granit-*` attributes so the host app can style them with the
// rest of its EntityDetail tree.
// ---------------------------------------------------------------------------

const TextDetailComponent: EntityDetailComponent = ({ value }) => formatText(value);

const BooleanDetailComponent: EntityDetailComponent = ({ value }) => {
  if (value === null || value === undefined) return EMPTY_DASH;
  return value ? '✓' : '✗';
};

const UrlDetailComponent: EntityDetailComponent = ({ value, propertyName }) => {
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

const EmailDetailComponent: EntityDetailComponent = ({ value, propertyName }) => {
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

const TelDetailComponent: EntityDetailComponent = ({ value, propertyName }) => {
  if (value === null || value === undefined || value === '') return EMPTY_DASH;
  const number = String(value);
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
 * Standard detail-component catalog. Pass it to
 * `<EntityRendererProvider components={{ form, detail: STANDARD_DETAIL_COMPONENTS.detail }}>`
 * to get URL / email / tel / boolean formatting out of the box. Apps
 * spread + override entries they want to customise:
 *
 * ```tsx
 * <EntityRendererProvider components={{
 *   form: STANDARD_FORM_COMPONENTS.form,
 *   detail: { ...STANDARD_DETAIL_COMPONENTS.detail, currency: MyCurrencyComponent },
 * }}>
 * ```
 *
 * Component keys mirror the form-component catalog ids so a field
 * declaring `component: 'text'` in the manifest reuses the same string
 * in both contexts.
 */
export const STANDARD_DETAIL_COMPONENTS: EntityComponentCatalog = Object.freeze({
  form: Object.freeze({}),
  detail: Object.freeze({
    text: TextDetailComponent,
    textarea: TextDetailComponent,
    integer: TextDetailComponent,
    decimal: TextDetailComponent,
    boolean: BooleanDetailComponent,
    date: TextDetailComponent,
    time: TextDetailComponent,
    datetime: TextDetailComponent,
    url: UrlDetailComponent,
    email: EmailDetailComponent,
    tel: TelDetailComponent,
  }) as Readonly<Record<string, EntityDetailComponent>>,
});

/** Default formatter used by `<EntityDetail />` when no component is registered. */
export function defaultDetailFormat(value: unknown): ReactNode {
  return formatText(value);
}
