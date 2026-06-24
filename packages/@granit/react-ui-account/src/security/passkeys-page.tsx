import {
  isAxiosError,
  useBeginPasskeyRegistration,
  useCompletePasskeyRegistration,
  useDeletePasskey,
  usePasskeys,
  useRenamePasskey,
} from '@granit/react-account';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
  toast,
} from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import { fromBase64Url } from '@granit/react-ui-authentication-local';
import { Fingerprint, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

import { getDefaultPasskeyName } from './passkey-device-name';

import type { AccountPasskeyInfo, PasskeyId } from '@granit/account';

function RenameDialog({
  passkey,
  open,
  onOpenChange,
}: {
  readonly passkey: AccountPasskeyInfo;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const rename = useRenamePasskey();
  const [name, setName] = useState(passkey.name ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await rename.mutateAsync({ id: passkey.id, request: { name } });
      toast.success(t('Account.Passkeys.RenameSuccess', 'Passkey renamed.'));
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[Passkeys] Rename failed', err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Account.Passkeys.RenameTitle', 'Rename passkey')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passkeyName">{t('Account.Passkeys.Name', 'Name')}</Label>
            <Input
              id="passkeyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={rename.isPending}>
              {rename.isPending ? t('Common.Loading') : t('Common.Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  passkeyId,
  open,
  onOpenChange,
}: {
  readonly passkeyId: PasskeyId;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const deletePasskey = useDeletePasskey();

  async function handleDelete() {
    try {
      await deletePasskey.mutateAsync(passkeyId);
      toast.success(t('Account.Passkeys.DeleteSuccess', 'Passkey removed.'));
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[Passkeys] Delete failed', err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Account.Passkeys.DeleteTitle', 'Remove passkey')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t(
            'Account.Passkeys.DeleteConfirm',
            'This passkey will be removed and you will no longer be able to use it to sign in.'
          )}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.Cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deletePasskey.isPending}>
            {deletePasskey.isPending ? t('Common.Loading') : t('Common.Delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PasskeysPage() {
  const { t } = useTranslation();
  const { formatDateTime, formatTimeAgo } = useDateFormatter();
  const { data: passkeys, isLoading } = usePasskeys();
  const beginRegistration = useBeginPasskeyRegistration();
  const completeRegistration = useCompletePasskeyRegistration();
  const [registerName, setRegisterName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [renameTarget, setRenameTarget] = useState<AccountPasskeyInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PasskeyId | null>(null);

  const supportsPasskeys = typeof globalThis !== 'undefined' && !!globalThis.PublicKeyCredential;

  function renderPasskeyList() {
    if (isLoading) {
      return (
        <div className="flex h-24 items-center justify-center">
          <Spinner />
        </div>
      );
    }
    if (passkeys && passkeys.length > 0) {
      return (
        <div className="divide-y divide-border">
          {passkeys.map((pk) => (
            <div key={pk.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {pk.name ?? (
                      <span className="text-muted-foreground">
                        {t('Account.Passkeys.Unnamed', 'Unnamed passkey')}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('Account.Passkeys.AddedOn', 'Added')} {formatDateTime(pk.createdAt)}
                    {pk.lastUsedAt
                      ? ` · ${t('Account.Passkeys.LastUsed', 'Last used')} ${formatTimeAgo(pk.lastUsedAt)}`
                      : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRenameTarget(pk)}
                  aria-label={t('Account.Passkeys.Rename', 'Rename')}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(pk.id)}
                  aria-label={t('Account.Passkeys.Delete', 'Delete')}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-2">
        <EmptyState
          icon={Fingerprint}
          message={t('Account.Passkeys.NoPasskeys', 'No passkeys registered')}
        />
        {!supportsPasskeys && (
          <Badge variant="secondary">
            {t('Account.Passkeys.NotSupported', 'Passkeys not supported in this browser')}
          </Badge>
        )}
      </div>
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      const optionsJson = await beginRegistration.mutateAsync();
      const options = JSON.parse(optionsJson) as PublicKeyCredentialCreationOptions;

      const credentialOptions = {
        ...options,
        challenge: fromBase64Url(options.challenge as unknown as string),
        user: {
          ...options.user,
          id: fromBase64Url(options.user.id as unknown as string),
        },
      };

      const credential = await navigator.credentials.create({ publicKey: credentialOptions });
      if (!credential) {
        toast.error(t('Account.Passkeys.RegistrationCancelled', 'Registration cancelled.'));
        return;
      }

      await completeRegistration.mutateAsync({
        credentialJson: JSON.stringify(credential),
        name: registerName || undefined,
      });

      setRegisterName('');
      setIsRegistering(false);
      toast.success(t('Account.Passkeys.RegisterSuccess', 'Passkey registered successfully.'));
    } catch (err) {
      // Axios errors are surfaced by the global MutationCache.onError toast; a
      // WebAuthn failure (e.g. user abort) is not an API error — surface it here.
      if (!isAxiosError(err)) {
        toast.error(t('Account.Passkeys.RegisterError', 'Failed to register passkey.'));
      }
      logger.error('[Passkeys] Registration failed', err);
    }
  }

  return (
    <div data-slot="passkeys-page" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Account.Passkeys.Title', 'Passkeys')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'Account.Passkeys.Subtitle',
            'Sign in without a password using biometrics or a security key'
          )}
        </p>
      </div>

      {/* Passkey list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('Account.Passkeys.ListTitle', 'Registered passkeys')}</CardTitle>
            <CardDescription>
              {t('Account.Passkeys.ListDescription', 'Manage passkeys registered to your account')}
            </CardDescription>
          </div>
          {supportsPasskeys && !isRegistering && (
            <Button
              size="sm"
              onClick={() => {
                setRegisterName((prev) => prev || getDefaultPasskeyName());
                setIsRegistering(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('Account.Passkeys.AddNew', 'Add passkey')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isRegistering && (
            <form
              onSubmit={handleRegister}
              className="rounded-lg border border-border p-4 space-y-4"
            >
              <p className="text-sm font-medium text-foreground">
                {t('Account.Passkeys.RegisterTitle', 'Register a new passkey')}
              </p>
              <div className="space-y-2">
                <Label htmlFor="passkeyRegisterName">
                  {t('Account.Passkeys.OptionalName', 'Name (optional)')}
                </Label>
                <Input
                  id="passkeyRegisterName"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder={t('Account.Passkeys.NamePlaceholder', 'e.g. Work laptop, YubiKey')}
                  aria-describedby="passkeyRegisterNameHelp"
                  autoFocus
                />
                <p id="passkeyRegisterNameHelp" className="text-xs text-muted-foreground">
                  {t(
                    'Account.Passkeys.NameHelp',
                    'Suggested from your browser and operating system. Edit it to recognise this device later.'
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={beginRegistration.isPending || completeRegistration.isPending}
                >
                  {beginRegistration.isPending || completeRegistration.isPending
                    ? t('Common.Loading')
                    : t('Account.Passkeys.RegisterButton', 'Register passkey')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsRegistering(false)}>
                  {t('Common.Cancel')}
                </Button>
              </div>
            </form>
          )}

          {renderPasskeyList()}
        </CardContent>
      </Card>

      {renameTarget && (
        <RenameDialog
          passkey={renameTarget}
          open={!!renameTarget}
          onOpenChange={(open) => !open && setRenameTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          passkeyId={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
