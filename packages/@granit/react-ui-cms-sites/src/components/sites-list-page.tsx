import { useCmsConfig, useDeleteSite, useSitesMeta } from '@granit/react-cms';
import { useTranslation } from '@granit/react-localization';
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { Alert, AlertDescription, Button, toast } from '@granit/react-ui';
import { ConfirmActionDialog, QueryEndpointDataTable } from '@granit/react-ui-kit';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { createSitesColumns } from './sites-columns';

import type { SiteResponse } from '@granit/cms';
import type { SortEntry } from '@granit/query-engine';

/** Static fallback sort used until `/sites/meta` resolves its `defaultSort`. */
const SITES_DEFAULT_SORT = 'slug';

/** Parse a `defaultSort` token (`field` / `-field`) into a single `SortEntry`. */
function parseSort(token: string): readonly SortEntry[] {
  return token.startsWith('-')
    ? [{ field: token.slice(1), direction: 'desc' }]
    : [{ field: token, direction: 'asc' }];
}

export function SitesListPage() {
  const { client, basePath } = useCmsConfig();

  return (
    <QueryProvider config={{ client, basePath: `${basePath}/sites` }}>
      <SitesGrid />
    </QueryProvider>
  );
}

function SitesGrid() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: meta } = useSitesMeta();
  const deleteSite = useDeleteSite();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; slug: string } | null>(null);

  const queryEndpoint = useQueryEndpoint<SiteResponse>({
    initialParams: {
      // Prefer the backend-advertised default sort; fall back to the static
      // `slug` ordering until `/sites/meta` resolves.
      sort: parseSort(meta?.defaultSort ?? SITES_DEFAULT_SORT),
    },
  });
  const isError = queryEndpoint.query.isError;

  const columns = useMemo(
    () =>
      createSitesColumns({
        t,
        navigate,
        onDelete: (site) => setDeleteTarget({ id: site.id, slug: site.slug }),
      }),
    [t, navigate]
  );

  function handleDelete(id: string) {
    deleteSite.mutate(id, {
      onSuccess: () => {
        toast.success(t('cms:Sites.DeleteSuccess', 'Site deleted.'));
      },
    });
  }

  return (
    <div data-slot="sites-list-page" className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('cms:Sites.Title', 'Sites')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('cms:Sites.Subtitle', 'Manage your CMS sites and their content.')}
          </p>
        </div>
        <Button asChild>
          <Link to="/cms/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('cms:Sites.NewSite', 'New site')}
          </Link>
        </Button>
      </header>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{t('cms:Sites.LoadError', 'Failed to load sites.')}</AlertDescription>
        </Alert>
      )}

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        tone="destructive"
        title={t('cms:Sites.DeleteConfirm.Title', 'Delete site?')}
        aria-label={t('cms:Sites.DeleteConfirm.Title', 'Delete site?')}
        description={t(
          'cms:Sites.DeleteConfirm.Description',
          'This will permanently delete "{{slug}}" and all its content.',
          { slug: deleteTarget?.slug ?? '' }
        )}
        confirmLabel={t('cms:Common.Delete', 'Delete')}
        cancelLabel={t('cms:Common.Cancel', 'Cancel')}
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
