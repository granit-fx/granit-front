import { openiddictConstraints, OpenIddictPermissions } from '@granit/openiddict-admin';
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
  toast,
} from '@granit/react-ui';
import { EmptyState, TablePagination } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { KeyRound, Loader2, Plus, ShieldOff, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { logger } from '../logger';
import { PAGE_SIZE_OPTIONS, shouldPaginate, usePageState } from '../pagination';

import type { AxiosError } from '@granit/react-openiddict-admin';

// Spec-driven validation: `subject`/`clientId` are required (+maxLength) and
// `scopes` is required, all derived from contracts/openapi/openiddict.json. The
// grant form carries no client-only rule, so the bare baseResolver is used.
interface GrantFormValues {
  readonly subject: string;
  readonly clientId: string;
  readonly scopes: string[];
}

// The constraints expose camelCase field names; the i18n label keys are
// PascalCase (`OpenIddict.Authorizations.Fields.Subject`). This bridges the two.
function authorizationLabel(field: string): string {
  return field.charAt(0).toUpperCase() + field.slice(1);
}

/** Drop a single scope chip from the list. Module-level to keep the render prop flat. */
const removeScope = (scopes: readonly string[], scope: string): string[] =>
  scopes.filter((item) => item !== scope);

export function OidcAuthorizationsPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(OpenIddictPermissions.Authorizations.Create);
  const canRevoke = hasPermission(OpenIddictPermissions.Authorizations.Revoke);

  const { page, pageSize, setPage, setPageSize, onRowsRemoved, resetPage } = usePageState();
  // Draft inputs are applied on submit so each keystroke doesn't hit the server.
  const [subjectDraft, setSubjectDraft] = useState('');
  const [clientIdDraft, setClientIdDraft] = useState('');
  const [filters, setFilters] = useState<{ subject?: string; clientId?: string }>({});

  const { data: authorizationsPage, isLoading } = useOidcAuthorizations({
    page,
    pageSize,
    ...filters,
  });
  const authorizations = authorizationsPage?.items;
  const createMutation = useCreateOidcAuthorization();
  const revokeMutation = useRevokeAuthorization();
  const revokeUserMutation = useRevokeUserAuthorizations();

  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revokeUserTarget, setRevokeUserTarget] = useState<string | null>(null);
  const [scopeInput, setScopeInput] = useState('');

  const hasFilters = filters.subject !== undefined || filters.clientId !== undefined;

  const applyFilters = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFilters({
        subject: subjectDraft.trim() || undefined,
        clientId: clientIdDraft.trim() || undefined,
      });
      resetPage();
    },
    [subjectDraft, clientIdDraft, resetPage]
  );

  const clearFilters = useCallback(() => {
    setSubjectDraft('');
    setClientIdDraft('');
    setFilters({});
    resetPage();
  }, [resetPage]);

  const grantResolver = createConstraintsResolver(
    openiddictConstraints.AdminOidcCreateAuthorizationRequest,
    t,
    {
      labelResolver: (field) =>
        t(`OpenIddict.Authorizations.Fields.${authorizationLabel(field)}`, field),
    }
  ) as unknown as Resolver<GrantFormValues>;

  const grantForm = useForm<GrantFormValues>({
    resolver: grantResolver,
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
      onRowsRemoved((authorizations?.length ?? 1) - 1);
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

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={applyFilters}
        data-slot="oidc-authorizations-filters"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-subject" className="text-xs text-muted-foreground">
            {t('OpenIddict.Authorizations.Filters.Subject')}
          </label>
          <Input
            id="filter-subject"
            value={subjectDraft}
            onChange={(e) => setSubjectDraft(e.target.value)}
            placeholder={t('OpenIddict.Authorizations.Filters.SubjectPlaceholder')}
            className="w-64"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-client-id" className="text-xs text-muted-foreground">
            {t('OpenIddict.Authorizations.Filters.ClientId')}
          </label>
          <Input
            id="filter-client-id"
            value={clientIdDraft}
            onChange={(e) => setClientIdDraft(e.target.value)}
            placeholder={t('OpenIddict.Authorizations.Filters.ClientIdPlaceholder')}
            className="w-64"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t('OpenIddict.Authorizations.Filters.Apply')}
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" onClick={clearFilters}>
            <X className="mr-1 size-3.5" />
            {t('OpenIddict.Authorizations.Filters.Clear')}
          </Button>
        )}
      </form>

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

      {!isLoading && shouldPaginate(authorizationsPage, pageSize) && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalCount={authorizationsPage?.totalCount ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      )}

      {!isLoading && (!authorizations || authorizations.length === 0) && (
        <EmptyState
          icon={KeyRound}
          message={
            hasFilters
              ? t('OpenIddict.Authorizations.EmptyFiltered')
              : t('OpenIddict.Authorizations.Empty')
          }
        />
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
