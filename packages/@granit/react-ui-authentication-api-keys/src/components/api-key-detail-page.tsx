import { useGranitClient } from '@granit/react-api-client';
import {
  useApiKey,
  useRevokeApiKey,
  useRotateApiKey,
  useUpdateApiKeyScopes,
} from '@granit/react-authentication-api-keys';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiKeyEnvironmentBadge } from './api-key-environment-badge';
import { ApiKeyRevokeDialog } from './api-key-revoke-dialog';
import { ApiKeyRotateDialog } from './api-key-rotate-dialog';
import { ApiKeyScopesForm } from './api-key-scopes-form';
import { ApiKeySecretDialog } from './api-key-secret-dialog';
import { ApiKeyStatusBadge } from './api-key-status-badge';
import { getApiKeyStatus } from './api-key-status-utils';
import { ApiKeyTypeBadge } from './api-key-type-badge';

import type { ApiKeyUpdateScopesFormValues } from '../validation';

export function ApiKeyDetailPage() {
  const { t } = useTranslation();
  const { formatTimeAgo } = useDateFormatter();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const client = useGranitClient();
  const { data: apiKey, isLoading } = useApiKey(id ?? '', { client });

  const revokeMutation = useRevokeApiKey({ client });
  const rotateMutation = useRotateApiKey({ client });
  const updateScopesMutation = useUpdateApiKeyScopes({ client });

  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRotateDialog, setShowRotateDialog] = useState(false);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [editingCidrs, setEditingCidrs] = useState(false);

  const handleRevoke = useCallback(async () => {
    if (!id) return;
    await revokeMutation.mutateAsync(id);
    setShowRevokeDialog(false);
  }, [id, revokeMutation]);

  const handleRotate = useCallback(async () => {
    if (!id) return;
    const result = await rotateMutation.mutateAsync(id);
    setShowRotateDialog(false);
    setRotatedSecret(result.rawSecret);
  }, [id, rotateMutation]);

  const handleUpdateScopes = useCallback(
    async (data: ApiKeyUpdateScopesFormValues) => {
      if (!id) return;
      await updateScopesMutation.mutateAsync({ id, request: data });
      setEditingPermissions(false);
      setEditingCidrs(false);
    },
    [id, updateScopesMutation]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('ApiKeys.NotFound')}</h2>
        <Button variant="outline" onClick={() => navigate('/api-keys')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('ApiKeys.BackToList')}
        </Button>
      </div>
    );
  }

  const status = getApiKeyStatus(apiKey.revokedAt, apiKey.expiresAt);
  const isRevoked = !!apiKey.revokedAt;
  const revokedAtDistance = apiKey.revokedAt ? formatTimeAgo(apiKey.revokedAt) : '';
  const expiresAtDistance = apiKey.expiresAt ? formatTimeAgo(apiKey.expiresAt) : '';

  return (
    <div data-slot="api-key-detail-page" className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/api-keys')}>
          <ArrowLeft className="mr-1 size-4" />
          {t('ApiKeys.BackToList')}
        </Button>
      </div>

      {isRevoked && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('ApiKeys.RevokedBanner', { date: revokedAtDistance })}
          </AlertDescription>
        </Alert>
      )}

      {status === 'expired' && !isRevoked && (
        <Alert>
          <AlertDescription>
            {t('ApiKeys.ExpiredBanner', { date: expiresAtDistance })}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{apiKey.name}</h2>
            <ApiKeyStatusBadge status={status} />
          </div>
          <div className="flex items-center gap-2">
            <ApiKeyTypeBadge type={apiKey.type} />
            <ApiKeyEnvironmentBadge environment={apiKey.environment} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card: Informations */}
        <Card>
          <CardHeader>
            <CardTitle>{t('ApiKeys.Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t('ApiKeys.Name')} value={apiKey.name} />
            <InfoRow
              label={t('ApiKeys.Prefix')}
              value={
                <code className="font-mono text-sm">
                  {apiKey.prefix}...{apiKey.lastFourChars}
                </code>
              }
            />
            <InfoRow label={t('ApiKeys.CacheBehavior')} value={apiKey.cacheBehavior} />
            <InfoRow label={t('ApiKeys.CreatedAt')} value={formatTimeAgo(apiKey.createdAt)} />
            {apiKey.expiresAt && (
              <InfoRow label={t('ApiKeys.ExpiresAt')} value={formatTimeAgo(apiKey.expiresAt)} />
            )}
            {apiKey.lastUsedAt && (
              <InfoRow label={t('ApiKeys.LastUsedAt')} value={formatTimeAgo(apiKey.lastUsedAt)} />
            )}
          </CardContent>
        </Card>

        {/* Card: Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('ApiKeys.Actions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isRevoked && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRotateDialog(true)}
                >
                  {t('ApiKeys.ConfirmRotate')}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowRevokeDialog(true)}
                >
                  {t('ApiKeys.ConfirmRevoke')}
                </Button>
              </>
            )}
            {isRevoked && (
              <p className="text-sm text-muted-foreground">{t('ApiKeys.RevokedNoActions')}</p>
            )}
          </CardContent>
        </Card>

        {/* Card: Permissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('ApiKeys.Permissions')}</CardTitle>
            {!isRevoked && !editingPermissions && (
              <Button variant="ghost" size="sm" onClick={() => setEditingPermissions(true)}>
                {t('Common.Edit')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingPermissions ? (
              <ApiKeyScopesForm
                defaultValues={{
                  permissions: [...apiKey.permissions],
                  allowedCidrs: [...apiKey.allowedCidrs],
                }}
                onSubmit={handleUpdateScopes}
                onCancel={() => setEditingPermissions(false)}
                isPending={updateScopesMutation.isPending}
                fields={['permissions']}
              />
            ) : (
              <TagListOrEmpty values={apiKey.permissions} emptyLabel={t('ApiKeys.NoPermissions')} />
            )}
          </CardContent>
        </Card>

        {/* Card: CIDR Restrictions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('ApiKeys.AllowedCidrs')}</CardTitle>
            {!isRevoked && !editingCidrs && (
              <Button variant="ghost" size="sm" onClick={() => setEditingCidrs(true)}>
                {t('Common.Edit')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingCidrs ? (
              <ApiKeyScopesForm
                defaultValues={{
                  permissions: [...apiKey.permissions],
                  allowedCidrs: [...apiKey.allowedCidrs],
                }}
                onSubmit={handleUpdateScopes}
                onCancel={() => setEditingCidrs(false)}
                isPending={updateScopesMutation.isPending}
                fields={['allowedCidrs']}
              />
            ) : (
              <TagListOrEmpty values={apiKey.allowedCidrs} emptyLabel={t('ApiKeys.NoCidrs')} />
            )}
          </CardContent>
        </Card>
      </div>

      <ApiKeyRevokeDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        onConfirm={handleRevoke}
        keyName={apiKey.name}
        isPending={revokeMutation.isPending}
      />

      <ApiKeyRotateDialog
        open={showRotateDialog}
        onOpenChange={setShowRotateDialog}
        onConfirm={handleRotate}
        keyName={apiKey.name}
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

function TagListOrEmpty({
  values,
  emptyLabel,
}: Readonly<{ values: readonly string[]; emptyLabel: string }>) {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="rounded-md border bg-muted px-2 py-0.5 text-sm font-mono">
          {v}
        </span>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
