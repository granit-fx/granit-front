import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useOptOutStatus, useRequestOptOut } from '@granit/react-privacy';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { Loader2, ShieldOff } from 'lucide-react';
import { useState } from 'react';

export function PrivacyOptOutPage() {
  const { t } = useTranslation();
  const { data: status, isLoading } = useOptOutStatus();
  const { mutate: doOptOut, isPending } = useRequestOptOut();
  const { formatDateTime } = useDateFormatter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div data-slot="privacy-opt-out-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Privacy.OptOut.Title', 'Data Sale Opt-Out')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'Privacy.OptOut.Subtitle',
            'Opt out of the sale or sharing of your personal data (CCPA — Do Not Sell or Share).'
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Privacy.OptOut.StatusTitle', 'Current Status')}</CardTitle>
          <CardDescription>
            {t(
              'Privacy.OptOut.StatusDescription',
              'Your opt-out preference under the applicable privacy regulation.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && status && (
            <>
              <div className="flex items-center gap-3">
                {status.isOptedOut ? (
                  <Badge variant="destructive">
                    {t('Privacy.OptOut.Badge.OptedOut', 'Opted Out')}
                  </Badge>
                ) : (
                  <Badge variant="default">
                    {t('Privacy.OptOut.Badge.Active', 'Active (not opted out)')}
                  </Badge>
                )}
                {status.regulation && (
                  <span className="text-sm text-muted-foreground">
                    {t('Privacy.OptOut.RegulationLabel', {
                      regulation: status.regulation,
                      defaultValue: 'Regulation: {{regulation}}',
                    })}
                  </span>
                )}
              </div>

              {status.optedOutAt && (
                <p className="text-sm text-muted-foreground">
                  {t('Privacy.OptOut.OptedOutOn', 'Opted out on')}{' '}
                  <span className="font-medium text-foreground">
                    {formatDateTime(status.optedOutAt)}
                  </span>
                </p>
              )}

              {!status.isOptedOut && (
                <>
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => setConfirmOpen(true)}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <ShieldOff className="mr-2 size-4" />
                    )}
                    {t('Privacy.OptOut.OptOutButton', 'Opt Out')}
                  </Button>
                  <ConfirmActionDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    title={t('Privacy.OptOut.ConfirmTitle', 'Confirm Opt-Out')}
                    description={t(
                      'Privacy.OptOut.ConfirmDescription',
                      'This will record your preference to opt out of the sale and sharing of your personal data. Depending on your jurisdiction, this action may not be reversible. Are you sure you want to proceed?'
                    )}
                    cancelLabel={t('Privacy.OptOut.Cancel', 'Cancel')}
                    confirmLabel={t('Privacy.OptOut.ConfirmButton', 'Confirm Opt-Out')}
                    onConfirm={() =>
                      doOptOut(undefined, {
                        onSuccess: () =>
                          toast.success(
                            t(
                              'Privacy.OptOut.SuccessToast',
                              'Your opt-out preference has been recorded.'
                            )
                          ),
                      })
                    }
                  />
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
