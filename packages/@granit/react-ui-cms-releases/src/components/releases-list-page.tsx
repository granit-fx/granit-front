import { useCmsConfig, usePublishRelease, useReleasesMeta } from '@granit/react-cms';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { Alert, AlertDescription, Button, Separator, toast } from '@granit/react-ui';
import { QueryEndpointDataTable } from '@granit/react-ui-kit';
import { ArrowLeft, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { ReleaseFormDialog } from './release-form-dialog';
import { createReleasesColumns } from './releases-columns';

import type { ReleaseResponse } from '@granit/cms';
import type { SortEntry } from '@granit/query-engine';

/** Static fallback sort used until `/releases/meta` resolves its `defaultSort`. */
const RELEASES_DEFAULT_SORT = '-createdAt';

/** Parse a `defaultSort` token (`field` / `-field`) into a single `SortEntry`. */
function parseSort(token: string): readonly SortEntry[] {
  return token.startsWith('-')
    ? [{ field: token.slice(1), direction: 'desc' }]
    : [{ field: token, direction: 'asc' }];
}

export function ReleasesListPage() {
  const { client, basePath } = useCmsConfig();
  const { id: siteId } = useParams<{ id: string }>();

  return (
    <QueryProvider config={{ client, basePath: `${basePath}/releases` }}>
      <ReleasesGrid siteId={siteId ?? ''} />
    </QueryProvider>
  );
}

function ReleasesGrid({ siteId }: { readonly siteId: string }) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const navigate = useNavigate();
  const { data: meta } = useReleasesMeta();
  const publishRelease = usePublishRelease();
  const [createOpen, setCreateOpen] = useState(false);

  const queryEndpoint = useQueryEndpoint<ReleaseResponse>({
    initialParams: {
      // Prefer the backend-advertised default sort; fall back to newest-first
      // until `/releases/meta` resolves.
      sort: parseSort(meta?.defaultSort ?? RELEASES_DEFAULT_SORT),
    },
  });
  const isError = queryEndpoint.query.isError;

  const handlePublish = useCallback(
    (release: ReleaseResponse) => {
      publishRelease.mutate(release.id, {
        onSuccess: () => {
          toast.success(
            t('cms:Releases.PublishSuccess', 'Release "{{name}}" published.', {
              name: release.name,
            })
          );
        },
      });
    },
    [publishRelease, t]
  );

  const columns = useMemo(
    () =>
      createReleasesColumns({
        t,
        formatDate,
        onView: (release) => navigate(`/cms/sites/${siteId}/releases/${release.id}`),
        onPublish: handlePublish,
      }),
    [t, formatDate, siteId, navigate, handlePublish]
  );

  return (
    <div data-slot="releases-list-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cms/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Sites.Title', 'Sites')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">
          {t('cms:Releases.Title', 'Releases')}
        </h2>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('cms:Releases.NewRelease', 'New release')}
        </Button>
      </div>

      <ReleaseFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('cms:Releases.LoadError', 'Failed to load releases.')}
          </AlertDescription>
        </Alert>
      )}

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />
    </div>
  );
}
