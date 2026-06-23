import { OpenIddictPermissions } from '@granit/openiddict-admin';
import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import {
  useCreateOidcAuthorization,
  useOidcAuthorizations,
  useRevokeAuthorization,
  useRevokeUserAuthorizations,
} from '@granit/react-openiddict-admin';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Spinner,
} from '@granit/react-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, Plus, ShieldOff } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { logger } from '../logger';

import type { AxiosError } from '@granit/api-client';

const grantSchema = z.object({
  subject: z.string().min(1),
  clientId: z.string().min(1),
  scopes: z.array(z.string()),
});

type GrantFormValues = z.infer<typeof grantSchema>;

/** Drop a single scope chip from the list. Module-level to keep the render prop flat. */
const removeScope = (scopes: readonly string[], scope: string): string[] =>
  scopes.filter((item) => item !== scope);

export function OidcAuthorizationsPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(OpenIddictPermissions.Authorizations.Create);
  const canRevoke = hasPermission(OpenIddictPermissions.Authorizations.Revoke);

  const { data: authorizations, isLoading } = useOidcAuthorizations();
  const createMutation = useCreateOidcAuthorization();
  const revokeMutation = useRevokeAuthorization();
  const revokeUserMutation = useRevokeUserAuthorizations();

  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revokeUserTarget, setRevokeUserTarget] = useState<string | null>(null);
  const [scopeInput, setScopeInput] = useState('');

  const grantForm = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: { subject: '', clientId: '', scopes: [] },
  });

  const handleGrant = async (data: GrantFormValues) => {
    try {
      await createMutation.mutateAsync({
        subject: data.subject,
        clientId: data.clientId,
        scopes: data.scopes,
      });
      toast.success(t('OpenIddict.Authorizations.GrantSuccess'));
      setGrantOpen(false);
      grantForm.reset();
      setScopeInput('');
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      logger.error('[OidcAuthorizations] grant failed', err);
      toast.error(
        status === 404
          ? t('OpenIddict.Authorizations.ClientNotFound')
          : t('OpenIddict.Authorizations.GrantError')
      );
    }
  };

  const addScope = useCallback(() => {
    const trimmed = scopeInput.trim();
    if (!trimmed) return;
    const current = grantForm.getValues('scopes');
    if (!current.includes(trimmed)) {
      grantForm.setValue('scopes', [...current, trimmed], { shouldValidate: true });
    }
    setScopeInput('');
  }, [scopeInput, grantForm]);

  const handleScopeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addScope();
      }
    },
    [addScope]
  );

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation.mutateAsync(revokeTarget);
      toast.success(t('OpenIddict.Authorizations.RevokeSuccess'));
      setRevokeTarget(null);
    } catch (err) {
      logger.error('[OidcAuthorizations] revoke failed', err);
      toast.error(t('OpenIddict.Authorizations.RevokeError'));
    }
  };

  const handleRevokeUser = async () => {
    if (!revokeUserTarget) return;
    try {
      await revokeUserMutation.mutateAsync(revokeUserTarget);
      toast.success(t('OpenIddict.Authorizations.RevokeUserSuccess'));
      setRevokeUserTarget(null);
    } catch (err) {
      logger.error('[OidcAuthorizations] revoke user failed', err);
      toast.error(t('OpenIddict.Authorizations.RevokeUserError'));
    }
  };

  return (
    <div data-slot="oidc-authorizations-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('OpenIddict.Authorizations.Title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('OpenIddict.Authorizations.Description')}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setGrantOpen(true)}>
            <Plus className="mr-1 size-4" />
            {t('OpenIddict.Authorizations.Grant')}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      )}

      {!isLoading && authorizations && authorizations.length > 0 && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Authorizations.Columns.Subject')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Authorizations.Columns.ClientId')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Authorizations.Columns.Status')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Authorizations.Columns.Type')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Authorizations.Columns.Scopes')}
                </th>
                {canRevoke && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {authorizations.map((auth) => (
                <tr key={auth.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{auth.subject}</td>
                  <td className="px-4 py-3 font-mono text-xs">{auth.clientId ?? '—'}</td>
                  <td className="px-4 py-3">{auth.status}</td>
                  <td className="px-4 py-3">{auth.type}</td>
                  <td className="px-4 py-3">
                    {(auth.scopes ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(auth.scopes ?? []).map((s) => (
                          <span
                            key={s}
                            className="inline-block rounded border bg-muted px-1.5 py-0.5 font-mono text-xs"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {canRevoke && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeUserTarget(auth.subject)}
                          title={t('OpenIddict.Authorizations.RevokeUser')}
                        >
                          <ShieldOff className="mr-1 size-3.5" />
                          {t('OpenIddict.Authorizations.RevokeUser')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(auth.id)}>
                          <ShieldOff className="mr-1 size-3.5 text-destructive" />
                          {t('OpenIddict.Authorizations.Revoke')}
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

      {!isLoading && (!authorizations || authorizations.length === 0) && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <KeyRound className="size-12 opacity-30" />
          <p>{t('OpenIddict.Authorizations.Empty')}</p>
        </div>
      )}

      {/* Grant consent dialog */}
      <Dialog open={grantOpen} onOpenChange={(open) => !open && setGrantOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Authorizations.GrantTitle')}</DialogTitle>
          </DialogHeader>
          <Form {...grantForm}>
            <form onSubmit={grantForm.handleSubmit(handleGrant)} className="space-y-4">
              <FormField
                control={grantForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Authorizations.Fields.Subject')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={grantForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Authorizations.Fields.ClientId')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={grantForm.control}
                name="scopes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Authorizations.Fields.Scopes')}</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={scopeInput}
                        onChange={(e) => setScopeInput(e.target.value)}
                        onKeyDown={handleScopeKeyDown}
                        placeholder={t('OpenIddict.Authorizations.Fields.ScopesPlaceholder')}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addScope}
                        disabled={!scopeInput.trim()}
                      >
                        {t('Common.Add')}
                      </Button>
                    </div>
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {field.value.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 font-mono text-xs"
                          >
                            {s}
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => field.onChange(removeScope(field.value, s))}
                              aria-label={`Remove ${s}`}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGrantOpen(false)}
                  disabled={createMutation.isPending}
                >
                  {t('Common.Cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                  {t('OpenIddict.Authorizations.Grant')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Revoke single authorization dialog */}
      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Authorizations.RevokeTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('OpenIddict.Authorizations.RevokeConfirm')}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              disabled={revokeMutation.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
              {t('OpenIddict.Authorizations.Revoke')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke all user authorizations dialog */}
      <Dialog open={!!revokeUserTarget} onOpenChange={(open) => !open && setRevokeUserTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Authorizations.RevokeUserTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('OpenIddict.Authorizations.RevokeUserConfirm', {
              subject: revokeUserTarget ?? '',
            })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeUserTarget(null)}
              disabled={revokeUserMutation.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeUser}
              disabled={revokeUserMutation.isPending}
            >
              {revokeUserMutation.isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
              {t('OpenIddict.Authorizations.RevokeUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
