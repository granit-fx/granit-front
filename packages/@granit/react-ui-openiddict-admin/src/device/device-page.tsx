import { useTranslation } from '@granit/react-localization';
import { useDeviceVerification } from '@granit/react-openiddict-admin';
import { Alert, AlertDescription, AlertTitle, Button, Input, Label } from '@granit/react-ui';
import { CheckCircle, Loader2, Monitor } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { ComponentType, ReactNode } from 'react';

export type DevicePageProps = {
  /**
   * Host layout wrapper (e.g. the app's public auth shell). Defaults to a
   * passthrough so the page renders standalone in tests / stories.
   */
  readonly layout?: ComponentType<{ readonly children: ReactNode }>;
};

const Passthrough = ({ children }: { readonly children: ReactNode }) => <>{children}</>;

export function DevicePage({ layout: Layout = Passthrough }: DevicePageProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [userCode, setUserCode] = useState(searchParams.get('user_code') ?? '');

  const { status, errorCode, submit } = useDeviceVerification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCode.trim()) return;
    submit(userCode.trim());
  };

  if (status === 'success') {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <CheckCircle className="size-12 text-success-600 dark:text-success-500" />
          <p className="font-medium">{t('OpenIddict.Device.Success')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Monitor className="size-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">{t('OpenIddict.Device.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('OpenIddict.Device.Description')}</p>
        </div>

        {status === 'error' && errorCode && (
          <Alert variant="destructive">
            <AlertTitle>{t('OpenIddict.Device.Error')}</AlertTitle>
            <AlertDescription className="font-mono text-xs">{errorCode}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-code">{t('OpenIddict.Device.UserCode')}</Label>
            <Input
              id="user-code"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder={t('OpenIddict.Device.UserCodePlaceholder')}
              disabled={status === 'pending'}
              autoComplete="off"
              className="font-mono uppercase tracking-widest"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={status === 'pending' || !userCode.trim()}
          >
            {status === 'pending' && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('OpenIddict.Device.Submit')}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
