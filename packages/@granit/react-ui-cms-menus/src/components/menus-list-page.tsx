import { useCmsConfig, useDeleteMenu, useMenusMeta } from '@granit/react-cms';
import { useTranslation } from '@granit/react-localization';
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { Alert, AlertDescription, Button, Separator, toast } from '@granit/react-ui';
import { ConfirmActionDialog, QueryEndpointDataTable } from '@granit/react-ui-kit';
import { ArrowLeft, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { createMenusColumns } from './menus-columns';

import type { MenuResponse } from '@granit/cms';
import type { SortEntry } from '@granit/query-engine';

/** Static fallback sort used until `/menus/meta` resolves its `defaultSort`. */
const MENUS_DEFAULT_SORT = 'key';

/** Parse a `defaultSort` token (`field` / `-field`) into a single `SortEntry`. */
function parseSort(token: string): readonly SortEntry[] {
  return token.startsWith('-')
    ? [{ field: token.slice(1), direction: 'desc' }]
    : [{ field: token, direction: 'asc' }];
}

export function MenusListPage() {
  const { client, basePath } = useCmsConfig();
  const { id: siteId } = useParams<{ id: string }>();

  return (
    <QueryProvider config={{ client, basePath: `${basePath}/menus` }}>
      <MenusGrid siteId={siteId ?? ''} />
    </QueryProvider>
  );
}

function MenusGrid({ siteId }: { readonly siteId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: meta } = useMenusMeta();
  const deleteMenu = useDeleteMenu();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; key: string } | null>(null);

  const queryEndpoint = useQueryEndpoint<MenuResponse>({
    initialParams: {
      filters: [{ field: 'siteId', operator: 'Eq', value: siteId }],
      // Prefer the backend-advertised default sort; fall back to the static
      // `key` ordering until `/menus/meta` resolves.
      sort: parseSort(meta?.defaultSort ?? MENUS_DEFAULT_SORT),
    },
  });
  const isError = queryEndpoint.query.isError;

  const columns = useMemo(
    () =>
      createMenusColumns({
        t,
        siteId,
        onDelete: (menu) => setDeleteTarget({ id: menu.id, key: menu.key }),
      }),
    [t, siteId]
  );

  function handleDelete(menuId: string) {
    deleteMenu.mutate(
      { id: menuId, siteId },
      {
        onSuccess: () => {
          toast.success(t('cms:Menus.DeleteSuccess', 'Menu deleted.'));
        },
      }
    );
  }

  return (
    <div data-slot="menus-list-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cms/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Sites.Title', 'Sites')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{t('cms:Menus.Title', 'Menus')}</h2>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => navigate(`/cms/sites/${siteId}/menus/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('cms:Menus.NewMenu', 'New menu')}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{t('cms:Menus.LoadError', 'Failed to load menus.')}</AlertDescription>
        </Alert>
      )}

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        tone="destructive"
        title={t('cms:Menus.DeleteConfirm.Title', 'Delete menu?')}
        description={t('cms:Menus.DeleteConfirm.Description', 'Delete menu "{{key}}"?', {
          key: deleteTarget?.key ?? '',
        })}
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
