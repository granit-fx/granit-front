import { Badge } from '@granit/react-ui';

import type { SeoMetadataListItem } from '@granit/react-cms-seo';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface SeoAuditColumnOptions {
  readonly t: TranslateFn;
}

/**
 * Columns for the SEO audit grid (`MapGranitQuery<SeoMetadata>` → `SeoMetadataListItem`).
 * Empty title / description / canonical render a "Missing" badge so the grid doubles
 * as a coverage report. Server-driven sort/filter is handled by the surrounding
 * `QueryEndpointDataTable`; columns map 1:1 to the projection's SQL-translatable fields.
 */
export function createSeoAuditColumns({
  t,
}: SeoAuditColumnOptions): DataTableColumnDef<SeoMetadataListItem, unknown>[] {
  const missing = () => <Badge variant="secondary">{t('cms:Seo.Audit.Missing', 'Missing')}</Badge>;

  return [
    {
      id: 'contentType',
      accessorKey: 'contentType',
      header: t('cms:Seo.Audit.ContentType', 'Content type'),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.contentType}</span>,
    },
    {
      id: 'contentId',
      accessorKey: 'contentId',
      header: t('cms:Seo.Audit.ContentId', 'Content ID'),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.contentId}</span>,
    },
    {
      id: 'culture',
      accessorKey: 'culture',
      header: t('cms:Seo.Audit.Culture', 'Culture'),
      cell: ({ row }) => <span>{row.original.culture ?? '—'}</span>,
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: t('cms:Seo.Audit.Title', 'Title'),
      cell: ({ row }) => row.original.title ?? missing(),
    },
    {
      id: 'description',
      accessorKey: 'description',
      header: t('cms:Seo.Audit.Description', 'Description'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description ?? missing()}
        </span>
      ),
    },
    {
      id: 'canonicalUrl',
      accessorKey: 'canonicalUrl',
      header: t('cms:Seo.Audit.Canonical', 'Canonical URL'),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.canonicalUrl ?? missing()}</span>
      ),
    },
  ];
}
