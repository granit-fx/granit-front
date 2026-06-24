import { ApiKeyQuickFilters } from '@granit/authentication-api-keys';
import { useGranitClient } from '@granit/react-api-client';
import {
  useApiKeys,
  useApiKeysQueryMeta,
  useRevokeApiKey,
  useRotateApiKey,
} from '@granit/react-authentication-api-keys';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Switch,
} from '@granit/react-ui';
import { useDebouncedValue } from '@granit/react-ui-kit';
import { KeyRound, Plus, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiKeyRevokeDialog } from './components/api-key-revoke-dialog';
import { ApiKeyRotateDialog } from './components/api-key-rotate-dialog';
import { ApiKeySecretDialog } from './components/api-key-secret-dialog';
import { ApiKeyTable } from './components/api-key-table';
import { API_KEY_ENVIRONMENTS, API_KEY_TYPES, DEFAULT_PAGE_SIZE } from './constants';

import type { ApiKeyListItemResponse, ApiKeyRotateResponse } from '@granit/authentication-api-keys';
import type { FilterEntry } from '@granit/query-engine';

/** Title-cases an environment name to match the `ApiKeys.Environments.*` key. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ApiKeyListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useGranitClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [page, setPage] = useState(1);

  const filters: FilterEntry[] = [];
  if (typeFilter !== 'all') {
    filters.push({ field: 'type', operator: 'Eq', value: typeFilter });
  }
  if (environmentFilter !== 'all') {
    filters.push({ field: 'environment', operator: 'Eq', value: environmentFilter });
  }

  const { data, isLoading } = useApiKeys(
    { client },
    {
      search: debouncedSearch || undefined,
      filters: filters.length > 0 ? filters : undefined,
      quickFilters: includeRevoked ? [ApiKeyQuickFilters.IncludeRevoked] : undefined,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }
  );

  const { data: queryMeta } = useApiKeysQueryMeta({ client });
  const revokeMutation = useRevokeApiKey({ client });
  const rotateMutation = useRotateApiKey({ client });

  const [revokeTarget, setRevokeTarget] = useState<ApiKeyListItemResponse | null>(null);
  const [rotateTarget, setRotateTarget] = useState<ApiKeyListItemResponse | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    await revokeMutation.mutateAsync(revokeTarget.id);
    setRevokeTarget(null);
  }, [revokeTarget, revokeMutation]);

  const handleRotate = useCallback(async () => {
    if (!rotateTarget) return;
    const result: ApiKeyRotateResponse = await rotateMutation.mutateAsync(rotateTarget.id);
    setRotateTarget(null);
    setRotatedSecret(result.rawSecret);
  }, [rotateTarget, rotateMutation]);

  const totalPages = data?.totalCount ? Math.ceil(data.totalCount / DEFAULT_PAGE_SIZE) : 0;
  const revokeTargetName = revokeTarget?.name ?? '';
  const rotateTargetName = rotateTarget?.name ?? '';

  return (
    <div data-slot="api-key-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('ApiKeys.Title')}</h2>
          <p className="text-sm text-muted-foreground">{t('ApiKeys.Description')}</p>
        </div>
        <Button onClick={() => navigate('/api-keys/new')}>
          <Plus className="mr-1 size-4" />
          {t('ApiKeys.Create')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={t('Common.SearchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('ApiKeys.Type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Common.All')}</SelectItem>
            {API_KEY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`ApiKeys.Types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={environmentFilter}
          onValueChange={(v) => {
            setEnvironmentFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('ApiKeys.Environment')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Common.All')}</SelectItem>
            {API_KEY_ENVIRONMENTS.map((env) => (
              <SelectItem key={env} value={env}>
                {t(`ApiKeys.Environments.${capitalize(env)}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            checked={includeRevoked}
            onCheckedChange={(v) => {
              setIncludeRevoked(v);
              setPage(1);
            }}
          />
          <span className="text-sm text-muted-foreground">{t('ApiKeys.IncludeRevoked')}</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      )}

      {queryMeta && (
        <p className="text-xs text-muted-foreground/60">
          {t('ApiKeys.QueryMeta', {
            fields: queryMeta.filterableFields.length,
            defaultValue: `${queryMeta.filterableFields.length} filterable fields`,
          })}
        </p>
      )}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <ApiKeyTable items={data.items} onRevoke={setRevokeTarget} onRotate={setRotateTarget} />
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('Common.Previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('Common.Next')}
              </Button>
            </div>
          )}
        </>
      )}

      {!isLoading && (!data || data.items.length === 0) && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <KeyRound className="size-12 opacity-30" />
          <p>{t('ApiKeys.NoKeys')}</p>
          <Button variant="outline" onClick={() => navigate('/api-keys/new')}>
            <Plus className="mr-1 size-4" />
            {t('ApiKeys.Create')}
          </Button>
        </div>
      )}

      <ApiKeyRevokeDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        onConfirm={handleRevoke}
        keyName={revokeTargetName}
        isPending={revokeMutation.isPending}
      />

      <ApiKeyRotateDialog
        open={!!rotateTarget}
        onOpenChange={(open) => !open && setRotateTarget(null)}
        onConfirm={handleRotate}
        keyName={rotateTargetName}
        isPending={rotateMutation.isPending}
      />

      <ApiKeySecretDialog
        open={!!rotatedSecret}
        secret={rotatedSecret ?? ''}
        onClose={() => setRotatedSecret(null)}
      />
    </div>
  );
}
