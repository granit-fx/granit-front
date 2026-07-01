import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { useCreateSigningKey, useDeleteSigningKey, useSigningKeys } from '@granit/react-webhooks';
import { WebhookSigningKeyStatus } from '@granit/webhooks';
import { RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { WebhookKeyStatusBadge } from './webhook-key-status-badge';
import { WebhookSecretDisplay } from './webhook-secret-display';

interface WebhookSigningKeysProps {
  subscriptionId: string;
  /** Masked preview of the active secret, shown until a fresh key is rotated. */
  signingSecretHint: string | null;
}

export function WebhookSigningKeys({
  subscriptionId,
  signingSecretHint,
}: Readonly<WebhookSigningKeysProps>) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();

  const { data: keys, isLoading } = useSigningKeys(subscriptionId);
  const rotateMutation = useCreateSigningKey();
  const revokeMutation = useDeleteSigningKey();

  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

  const activeCount = useMemo(
    () => (keys ?? []).filter((k) => k.status === WebhookSigningKeyStatus.Active).length,
    [keys]
  );

  const handleRotate = useCallback(async () => {
    const result = await rotateMutation.mutateAsync(subscriptionId);
    setRotatedSecret(result.plainSecret);
  }, [rotateMutation, subscriptionId]);

  const handleRevokeConfirm = useCallback(async () => {
    if (!keyToRevoke) return;
    await revokeMutation.mutateAsync({ subscriptionId, keyId: keyToRevoke });
    setKeyToRevoke(null);
  }, [keyToRevoke, revokeMutation, subscriptionId]);

  /** The last remaining Active key cannot be revoked (backend rejects it). */
  const canRevoke = useCallback(
    (status: WebhookSigningKeyStatus) =>
      status !== WebhookSigningKeyStatus.Revoked &&
      !(status === WebhookSigningKeyStatus.Active && activeCount <= 1),
    [activeCount]
  );

  return (
    <div data-slot="webhook-signing-keys" className="space-y-4">
      {rotatedSecret ? (
        // Distinct key → remount so the one-time secret starts revealed
        // (WebhookSecretDisplay seeds its visibility from isOneTime on mount).
        <WebhookSecretDisplay key="rotated" secret={rotatedSecret} isOneTime />
      ) : (
        <WebhookSecretDisplay
          key="hint"
          secret={signingSecretHint ?? '••••••••••••••••'}
          onRotate={handleRotate}
          isRotating={rotateMutation.isPending}
          canReveal={false}
        />
      )}

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t('Webhooks.Keys.Title')}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRotate}
          disabled={rotateMutation.isPending}
        >
          <RefreshCw
            className={`mr-1 size-3.5 ${rotateMutation.isPending ? 'animate-spin' : ''}`}
          />
          {t('Webhooks.Keys.Rotate')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Webhooks.Keys.Columns.Status')}</TableHead>
              <TableHead>{t('Webhooks.Keys.Columns.CreatedAt')}</TableHead>
              <TableHead>{t('Webhooks.Keys.Columns.ExpiresAt')}</TableHead>
              <TableHead className="text-right">{t('Webhooks.Keys.Columns.Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(keys ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {t('Webhooks.Keys.Empty')}
                </TableCell>
              </TableRow>
            )}
            {(keys ?? []).map((key) => (
              <TableRow key={key.id}>
                <TableCell>
                  <WebhookKeyStatusBadge status={key.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(key.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {key.revokedAt
                    ? t('Webhooks.Keys.RevokedAt', { date: formatDateTime(key.revokedAt) })
                    : (key.expiresAt && formatDateTime(key.expiresAt)) || '—'}
                </TableCell>
                <TableCell className="text-right">
                  {canRevoke(key.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setKeyToRevoke(key.id)}
                      disabled={revokeMutation.isPending}
                    >
                      {t('Webhooks.Keys.Revoke')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmActionDialog
        open={keyToRevoke !== null}
        onOpenChange={(open) => !open && setKeyToRevoke(null)}
        tone="destructive"
        title={t('Webhooks.Keys.ConfirmRevokeTitle')}
        description={t('Webhooks.Keys.ConfirmRevokeMessage')}
        confirmLabel={t('Webhooks.Keys.Revoke')}
        isPending={revokeMutation.isPending}
        onConfirm={handleRevokeConfirm}
      />
    </div>
  );
}
