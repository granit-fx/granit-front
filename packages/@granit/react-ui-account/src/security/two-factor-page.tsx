import {
  useAuthenticatorKey,
  useDisableTwoFactor,
  useDisableTwoFactorEmail,
  useEnableTwoFactor,
  useEnableTwoFactorEmail,
  useGenerateRecoveryCodes,
  useSendTwoFactorEmailEnrollmentCode,
  useTwoFactorStatus,
} from '@granit/react-account';
import { useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Spinner,
} from '@granit/react-ui';
import { CheckCircle, Copy, Mail, Shield, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { logger } from '../logger';

/** Seconds before a fresh email enrollment code can be requested again. */
const RESEND_COOLDOWN_SECONDS = 30;

function EnableTwoFactorForm({ onSuccess }: { readonly onSuccess: () => void }) {
  const { t } = useTranslation();
  const { data: keyData, isLoading } = useAuthenticatorKey();
  const enable = useEnableTwoFactor();
  const [code, setCode] = useState('');
  const [hasError, setHasError] = useState(false);

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await enable.mutateAsync({ code });
      toast.success(t('Account.TwoFactor.EnabledSuccess', '2FA enabled successfully.'));
      if (result.recoveryCodes.length > 0) {
        toast.info(
          t(
            'Account.TwoFactor.RecoveryCodesGenerated',
            `${result.recoveryCodes.length} recovery codes generated. Save them safely.`
          )
        );
      }
      onSuccess();
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast;
      // flag the field so it reads as invalid, like a pre-submit validation.
      setHasError(true);
      logger.error('[TwoFactor] Enable failed', err);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleEnable} className="space-y-4">
      {keyData?.qrCodeUri && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">
            {t('Account.TwoFactor.ScanQrCode', 'Scan this QR code')}
          </p>
          <div className="rounded-md bg-white p-3">
            <QRCodeSVG
              value={keyData.qrCodeUri}
              size={176}
              marginSize={0}
              aria-label={t('Account.TwoFactor.QrCodeAlt', 'Two-factor authentication QR code')}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {t(
              'Account.TwoFactor.ScanQrInstructions',
              'Scan with your authenticator app, or enter the setup key manually below.'
            )}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">
          {t('Account.TwoFactor.ScanKey', 'Authenticator setup key')}
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono text-foreground border border-border">
            {keyData?.sharedKey}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              void navigator.clipboard.writeText(keyData?.sharedKey ?? '');
              toast.success(t('Common.Copied', 'Copied!'));
            }}
            aria-label={t('Common.Copy', 'Copy')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t(
            'Account.TwoFactor.SetupInstructions',
            'Enter this key in your authenticator app (Google Authenticator, Authy, etc.)'
          )}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="totpCode">
          {t('Account.TwoFactor.VerificationCode', 'Verification code')}
        </Label>
        <Input
          id="totpCode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          placeholder="123456"
          value={code}
          onChange={(e) => {
            // Authenticator apps display codes grouped (e.g. "123 456"); strip
            // whitespace on input so a pasted code passes the numeric pattern.
            setCode(e.target.value.replaceAll(/\s/g, ''));
            if (hasError) setHasError(false);
          }}
          autoComplete="one-time-code"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? 'totpCode-error' : undefined}
          required
        />
        {hasError && (
          <p id="totpCode-error" className="text-sm text-destructive">
            {t('Account.TwoFactor.InvalidCode', 'Invalid verification code.')}
          </p>
        )}
      </div>

      <Button type="submit" disabled={enable.isPending || !code}>
        {enable.isPending ? t('Common.Loading') : t('Account.TwoFactor.Enable', 'Enable 2FA')}
      </Button>
    </form>
  );
}

function RecoveryCodesDialog({
  codes,
  onClose,
}: {
  readonly codes: readonly string[];
  readonly onClose: () => void;
}) {
  const { t } = useTranslation();

  function copyAll() {
    void navigator.clipboard.writeText(codes.join('\n'));
    toast.success(t('Common.Copied', 'Copied!'));
  }

  return (
    <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">
        {t('Account.TwoFactor.SaveCodes', 'Save your recovery codes')}
      </p>
      <p className="text-xs text-muted-foreground">
        {t(
          'Account.TwoFactor.CodesWarning',
          'Store these codes somewhere safe. Each code can only be used once.'
        )}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {codes.map((c) => (
          <code
            key={c}
            className="rounded bg-background px-2 py-1 text-sm font-mono border border-border"
          >
            {c}
          </code>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={copyAll}>
          <Copy className="mr-2 h-4 w-4" />
          {t('Common.CopyAll', 'Copy all')}
        </Button>
        <Button size="sm" onClick={onClose}>
          {t('Common.Done', 'Done')}
        </Button>
      </div>
    </div>
  );
}

/** Enabled/Disabled status pill, shared by the 2FA status and email-OTP cards. */
function FactorStatusBadge({ enabled }: { readonly enabled: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant={enabled ? 'default' : 'secondary'}
      className={
        enabled
          ? 'border-success-500/25 bg-success-500/15 text-success-600 dark:text-success-500'
          : ''
      }
    >
      {enabled ? (
        <>
          <CheckCircle className="mr-1 h-3 w-3" />
          {t('Account.TwoFactor.Enabled', 'Enabled')}
        </>
      ) : (
        <>
          <XCircle className="mr-1 h-3 w-3" />
          {t('Account.TwoFactor.Disabled', 'Disabled')}
        </>
      )}
    </Badge>
  );
}

/** Password-confirmed teardown of the email factor (step-up auth). */
function EmailOtpDisableForm() {
  const { t } = useTranslation();
  const disableEmail = useDisableTwoFactorEmail();
  const [password, setPassword] = useState('');

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    try {
      await disableEmail.mutateAsync({ password });
      setPassword('');
      toast.success(t('Account.TwoFactor.EmailOtpDisabledSuccess', 'Email codes disabled.'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TwoFactor] Disable email factor failed', err);
    }
  }

  return (
    <form onSubmit={handleDisable} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="emailOtpDisablePassword">
          {t('Account.Password.CurrentPassword', 'Current password')}
        </Label>
        <Input
          id="emailOtpDisablePassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" variant="destructive" disabled={disableEmail.isPending || !password}>
        {disableEmail.isPending
          ? t('Common.Loading')
          : t('Account.TwoFactor.DisableEmailOtp', 'Disable email codes')}
      </Button>
    </form>
  );
}

/** Confirm-code step of email enrollment, with a cooldown-gated resend. */
function EmailOtpConfirmForm({
  onSendCode,
  isSending,
  isCoolingDown,
  cooldown,
}: {
  readonly onSendCode: () => void;
  readonly isSending: boolean;
  readonly isCoolingDown: boolean;
  readonly cooldown: number;
}) {
  const { t } = useTranslation();
  const enableEmail = useEnableTwoFactorEmail();
  const [code, setCode] = useState('');
  const [hasError, setHasError] = useState(false);

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault();
    try {
      await enableEmail.mutateAsync({ code });
      setCode('');
      toast.success(t('Account.TwoFactor.EmailOtpEnabledSuccess', 'Email codes enabled.'));
    } catch (err) {
      // Flag the field invalid; the API error toast surfaces the detail.
      setHasError(true);
      logger.error('[TwoFactor] Enable email factor failed', err);
    }
  }

  return (
    <form onSubmit={handleEnable} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t(
          'Account.TwoFactor.EmailEnrollInstructions',
          'Enter the code we emailed you to confirm this factor.'
        )}
      </p>
      <div className="space-y-2">
        <Label htmlFor="emailOtpCode">
          {t('Account.TwoFactor.VerificationCode', 'Verification code')}
        </Label>
        <Input
          id="emailOtpCode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          placeholder="123456"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replaceAll(/\s/g, ''));
            if (hasError) setHasError(false);
          }}
          autoComplete="one-time-code"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? 'emailOtpCode-error' : undefined}
          required
        />
        {hasError && (
          <p id="emailOtpCode-error" className="text-sm text-destructive">
            {t('Account.TwoFactor.InvalidCode', 'Invalid verification code.')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={enableEmail.isPending || !code}>
          {enableEmail.isPending
            ? t('Common.Loading')
            : t('Account.TwoFactor.EnableEmailOtp', 'Enable email codes')}
        </Button>
        <button
          type="button"
          className="text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          onClick={onSendCode}
          disabled={isCoolingDown || isSending}
        >
          {isCoolingDown
            ? t('Account.TwoFactor.ResendEmailCodeCooldown', {
                seconds: cooldown,
                defaultValue: `Resend in ${cooldown}s`,
              })
            : t('Account.TwoFactor.ResendEmailCode', 'Resend code')}
        </button>
      </div>
    </form>
  );
}

/** Two-step send-then-confirm enrollment for the email one-time-code factor. */
function EmailOtpEnrollment() {
  const { t } = useTranslation();
  const sendCode = useSendTwoFactorEmailEnrollmentCode();
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const isCoolingDown = cooldown > 0;
  useEffect(() => {
    if (!isCoolingDown) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [isCoolingDown]);

  async function handleSendCode() {
    try {
      await sendCode.mutateAsync();
      setCodeSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(
        t('Account.TwoFactor.EmailCodeSent', 'Verification code sent. Check your inbox.')
      );
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TwoFactor] Send email enrollment code failed', err);
    }
  }

  return (
    <div className="space-y-4">
      {codeSent ? (
        <EmailOtpConfirmForm
          onSendCode={handleSendCode}
          isSending={sendCode.isPending}
          isCoolingDown={isCoolingDown}
          cooldown={cooldown}
        />
      ) : (
        <Button type="button" onClick={handleSendCode} disabled={sendCode.isPending}>
          {sendCode.isPending
            ? t('Common.Loading')
            : t('Account.TwoFactor.SendEmailCode', 'Send verification code')}
        </Button>
      )}
    </div>
  );
}

/**
 * Email one-time-code factor — an opt-in second factor alongside the
 * authenticator app. Enrollment is a two-step send-then-confirm; disabling
 * requires the current password as step-up auth, mirroring the authenticator
 * disable flow.
 */
function EmailOtpCard({ enrolled }: { readonly enrolled: boolean }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('Account.TwoFactor.EmailOtpTitle', 'Email one-time codes')}
          </CardTitle>
          <FactorStatusBadge enabled={enrolled} />
        </div>
        <CardDescription>
          {t(
            'Account.TwoFactor.EmailOtpDescription',
            'Receive a single-use code by email when you sign in.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>{enrolled ? <EmailOtpDisableForm /> : <EmailOtpEnrollment />}</CardContent>
    </Card>
  );
}

export function TwoFactorPage() {
  const { t } = useTranslation();
  const { data: status, isLoading } = useTwoFactorStatus();
  const disableTwoFactor = useDisableTwoFactor();
  const generateCodes = useGenerateRecoveryCodes();
  const [disablePassword, setDisablePassword] = useState('');
  const [regenPassword, setRegenPassword] = useState('');
  const [newCodes, setNewCodes] = useState<readonly string[] | null>(null);

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    try {
      await disableTwoFactor.mutateAsync({ password: disablePassword });
      setDisablePassword('');
      toast.success(t('Account.TwoFactor.DisabledSuccess', '2FA disabled.'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TwoFactor] Disable failed', err);
    }
  }

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await generateCodes.mutateAsync({ password: regenPassword });
      setRegenPassword('');
      setNewCodes(result.recoveryCodes);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TwoFactor] Generate codes failed', err);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div data-slot="two-factor-page" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Account.TwoFactor.Title', 'Two-factor authentication')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('Account.TwoFactor.Subtitle', 'Secure your account with TOTP')}
        </p>
      </div>

      {/* Status card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('Account.TwoFactor.Status', 'Status')}
            </CardTitle>
            <FactorStatusBadge enabled={!!status?.isEnabled} />
          </div>
          {status?.isEnabled && (
            <CardDescription>
              {t('Account.TwoFactor.RecoveryCodesLeft', {
                count: status.recoveryCodesLeft,
                defaultValue: `${status.recoveryCodesLeft} recovery codes remaining`,
              })}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Enable 2FA */}
      {!status?.isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Account.TwoFactor.SetupTitle', 'Set up authenticator app')}</CardTitle>
            <CardDescription>
              {t(
                'Account.TwoFactor.SetupDescription',
                'Use an authenticator app to generate one-time codes'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnableTwoFactorForm onSuccess={() => undefined} />
          </CardContent>
        </Card>
      )}

      {/* Disable 2FA */}
      {status?.isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Account.TwoFactor.DisableTitle', 'Disable 2FA')}</CardTitle>
            <CardDescription>
              {t(
                'Account.TwoFactor.DisableDescription',
                'You will need to enter your password to confirm'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDisable} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disablePassword">
                  {t('Account.Password.CurrentPassword', 'Current password')}
                </Label>
                <Input
                  id="disablePassword"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                disabled={disableTwoFactor.isPending || !disablePassword}
              >
                {disableTwoFactor.isPending
                  ? t('Common.Loading')
                  : t('Account.TwoFactor.DisableButton', 'Disable 2FA')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recovery codes */}
      {status?.isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Account.TwoFactor.RecoveryCodesTitle', 'Recovery codes')}</CardTitle>
            <CardDescription>
              {t(
                'Account.TwoFactor.RecoveryCodesDescription',
                'Generate new recovery codes. This will invalidate all existing codes.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {newCodes ? (
              <RecoveryCodesDialog codes={newCodes} onClose={() => setNewCodes(null)} />
            ) : (
              <>
                <Separator />
                <form onSubmit={handleGenerateCodes} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="regenPassword">
                      {t('Account.Password.CurrentPassword', 'Current password')}
                    </Label>
                    <Input
                      id="regenPassword"
                      type="password"
                      value={regenPassword}
                      onChange={(e) => setRegenPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={generateCodes.isPending || !regenPassword}
                  >
                    {generateCodes.isPending
                      ? t('Common.Loading')
                      : t('Account.TwoFactor.GenerateCodes', 'Generate new codes')}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email one-time codes — opt-in second factor, managed independently */}
      <EmailOtpCard enrolled={!!status?.hasEmailOtp} />
    </div>
  );
}
