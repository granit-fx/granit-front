import { resolveLabel, useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';

import type {
  CollectionColumnManifest,
  EntityCollectionSectionManifest,
} from './manifest-extensions';
import type { ReactNode } from 'react';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

type DateFormatter = (date: string | Date) => string;

const ANCHOR_CLASS =
  'text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none';

function formatLinkCell(value: string, component: 'email' | 'tel' | 'url'): ReactNode {
  if (component === 'email') {
    return (
      <a href={`mailto:${value}`} className={ANCHOR_CLASS}>
        {value}
      </a>
    );
  }
  if (component === 'tel') {
    const dialable = value.replaceAll(/[^+\d]/g, '');
    return (
      <a href={`tel:${dialable}`} className={ANCHOR_CLASS}>
        {value}
      </a>
    );
  }
  // Reject any URL whose scheme is not http(s) to prevent `javascript:`
  // and `data:` injection via untrusted entity field values (CWE-79).
  // Same-origin relative paths starting with `/` (but not `//`) are allowed.
  const isExternal = /^https?:\/\//i.test(value);
  const isInternal = value.startsWith('/') && !value.startsWith('//');
  if (!isExternal && !isInternal) {
    return <>{value}</>;
  }
  return (
    <a
      href={value}
      className={ANCHOR_CLASS}
      {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {value}
    </a>
  );
}

function formatDateCell(
  value: string,
  component: 'date' | 'datetime',
  formatDate: DateFormatter,
  formatDateTime: DateFormatter
): ReactNode {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  // Timezone-aware (user PreferredTimezone) via useDateFormatter, not raw Intl.
  return component === 'datetime' ? formatDateTime(value) : formatDate(value);
}

function formatCell(
  value: unknown,
  component: string | null | undefined,
  currency: string,
  locale: string,
  formatDate: DateFormatter,
  formatDateTime: DateFormatter
): ReactNode {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';

  const isLinkComponent = component === 'email' || component === 'tel' || component === 'url';
  if (isLinkComponent && typeof value === 'string' && value.length > 0) {
    return formatLinkCell(value, component);
  }

  if (component === 'money' && typeof value === 'number') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value / 100);
  }

  if ((component === 'date' || component === 'datetime') && typeof value === 'string') {
    return formatDateCell(value, component, formatDate, formatDateTime);
  }

  if (!component && typeof value === 'string' && ISO_DATE_RE.test(value)) {
    return formatDateCell(value, 'date', formatDate, formatDateTime);
  }

  if (typeof value === 'object') return JSON.stringify(value);
  // Narrowed to primitive scalars above — `String()` is safe.
  return String(value); // NOSONAR: remaining types (symbol, function) stringify safely
}

function alignClass(align: CollectionColumnManifest['align']): string {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

// Generic child-collection section rendered from the manifest's
// `collectionSections[]`. Reads `values[section.propertyName]` as the
// source array (camelCase wire), formats each cell per
// `column.component`, and optionally renders an aggregate footer (e.g.
// `Sum` of `total` for invoice line items).
//
// The component knows nothing about which entity it's mounted under —
// every entity-specific decision (which property holds the rows, which
// columns, which format) lives in the manifest.
export function CollectionSectionCard({
  section,
  values,
  locale,
}: {
  readonly section: EntityCollectionSectionManifest;
  readonly values: Readonly<Record<string, unknown>>;
  readonly locale: string;
}) {
  const { t } = useTranslation();
  const { formatDate, formatDateTime } = useDateFormatter();
  const rows =
    (values[section.propertyName] as readonly Record<string, unknown>[] | undefined) ?? [];
  const currency =
    section.currencyProperty == null
      ? 'EUR'
      : ((values[section.currencyProperty] as string | undefined) ?? 'EUR');

  const sectionLabel = resolveLabel(section.labelKey, section.key);

  if (rows.length === 0) {
    return (
      <Card data-slot="collection-section-card" data-section-key={section.key}>
        <CardHeader>
          <CardTitle>{sectionLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('Collection.Empty', 'No items.')}</p>
        </CardContent>
      </Card>
    );
  }

  const footerSum =
    section.footer?.aggregate === 'Sum'
      ? rows.reduce((acc, row) => {
          const v = row[section.footer!.propertyName];
          return acc + (typeof v === 'number' ? v : 0);
        }, 0)
      : null;

  return (
    <Card data-slot="collection-section-card" data-section-key={section.key}>
      <CardHeader>
        <CardTitle>{sectionLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {section.columns.map((column) => (
                  <TableHead key={column.propertyName} className={alignClass(column.align)}>
                    {resolveLabel(column.labelKey, column.propertyName)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={(row.id as string | undefined) ?? idx}>
                  {section.columns.map((column) => (
                    <TableCell key={column.propertyName} className={alignClass(column.align)}>
                      {formatCell(
                        row[column.propertyName],
                        column.component,
                        currency,
                        locale,
                        formatDate,
                        formatDateTime
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            {section.footer && footerSum !== null && (
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={section.columns.length - 1}
                    className="text-right font-semibold"
                  >
                    {resolveLabel(section.footer.labelKey ?? null, 'Total')}
                  </TableCell>
                  <TableCell
                    className={`${alignClass(section.columns.at(-1)?.align)} font-semibold`}
                  >
                    {formatCell(
                      footerSum,
                      section.footer.component,
                      currency,
                      locale,
                      formatDate,
                      formatDateTime
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
