import { usePermissions } from '@granit/react-authorization';
import {
  useCreateDocumentPublicLink,
  useDocumentPublicLinks,
  useRevokeDocumentPublicLink,
} from '@granit/react-documents';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { DOCUMENTS_PERMISSIONS } from './constants';

import type { PublicLinkScope } from '@granit/documents';

export function DocumentPublicLinksPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(DOCUMENTS_PERMISSIONS.Documents.Manage);

  const links = useDocumentPublicLinks(id ?? '');
  const createLink = useCreateDocumentPublicLink();
  const revokeLink = useRevokeDocumentPublicLink();

  const [scope, setScope] = useState<PublicLinkScope>('Download');
  const [ttlDays, setTtlDays] = useState(7);
  const [maxUsesRaw, setMaxUsesRaw] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  if (!id) {
    return (
      <div data-slot="document-public-links-page" className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {t('documents:PublicLinks.NotFound', 'Document not found.')}
        </p>
      </div>
    );
  }

  function handleCreate() {
    if (!id) return;
    createLink.mutate({
      documentId: id,
      request: {
        scope,
        ttlDays,
        maxUses: maxUsesRaw.trim() === '' ? null : Number(maxUsesRaw),
      },
    });
    setMaxUsesRaw('');
  }

  return (
    <div data-slot="document-public-links-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('documents:PublicLinks.Title', 'Public Links')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'documents:PublicLinks.Subtitle',
            'Shareable links that grant scoped, time-limited access without authentication.'
          )}
        </p>
      </header>

      {canManage && (
        <section className="rounded-lg border p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t('documents:PublicLinks.Create', 'Create link')}
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="pl-scope" className="block text-xs font-medium text-muted-foreground">
                {t('documents:PublicLinks.Scope', 'Scope')}
              </label>
              <select
                id="pl-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as PublicLinkScope)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="Download">Download</option>
                <option value="View">View</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="pl-ttl" className="block text-xs font-medium text-muted-foreground">
                {t('documents:PublicLinks.TtlDays', 'Validity (days)')}
              </label>
              <input
                id="pl-ttl"
                type="number"
                min={1}
                max={365}
                value={ttlDays}
                onChange={(e) => setTtlDays(Number(e.target.value))}
                className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pl-max" className="block text-xs font-medium text-muted-foreground">
                {t('documents:PublicLinks.MaxUses', 'Max uses (blank = unlimited)')}
              </label>
              <input
                id="pl-max"
                type="number"
                min={1}
                value={maxUsesRaw}
                onChange={(e) => setMaxUsesRaw(e.target.value)}
                className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <Button type="button" onClick={handleCreate} disabled={createLink.isPending}>
              {createLink.isPending
                ? t('documents:PublicLinks.Creating', 'Creating…')
                : t('documents:PublicLinks.CreateButton', 'Create')}
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t('documents:PublicLinks.ActiveLinks', 'Active links')}
        </h3>

        {links.isLoading && (
          <p className="text-sm text-muted-foreground">
            {t('documents:PublicLinks.Loading', 'Loading links…')}
          </p>
        )}

        {links.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('documents:PublicLinks.Empty', 'No public links yet.')}
          </p>
        )}

        {links.data && links.data.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {t('documents:PublicLinks.Header.Scope', 'Scope')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {t('documents:PublicLinks.Header.ExpiresAt', 'Expires')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {t('documents:PublicLinks.Header.Uses', 'Uses')}
                  </th>
                  {canManage && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {links.data.map((link) => (
                  <tr key={link.id}>
                    <td className="px-4 py-2">{link.scope}</td>
                    <td className="px-4 py-2">
                      {link.expiresAt ? formatDateTime(link.expiresAt) : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {link.currentUses}
                      {link.maxUses === null ? '' : ` / ${String(link.maxUses)}`}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="text"
                            placeholder={t('documents:PublicLinks.RevokePlaceholder', 'Reason')}
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            className="h-7 w-32 rounded border border-input bg-background px-2 text-xs"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={revokeLink.isPending}
                            onClick={() => {
                              revokeLink.mutate({
                                id: link.id,
                                documentId: link.documentId,
                                request: { reason: revokeReason || null },
                              });
                              setRevokeReason('');
                            }}
                          >
                            {t('documents:PublicLinks.Revoke', 'Revoke')}
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
