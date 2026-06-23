import { useTranslation } from '@granit/react-localization';
import { useExportScopes, useRequestExportOnBehalfOf } from '@granit/react-privacy';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from '@granit/react-ui';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function PrivacyAdminDsrPage() {
  const { t } = useTranslation();
  const { data: scopes, isLoading: isLoadingScopes } = useExportScopes();
  const { mutate: doExportOnBehalf, isPending, isSuccess } = useRequestExportOnBehalfOf();

  const [subjectUserId, setSubjectUserId] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  function handleScopeChange(providerName: string, checked: boolean | 'indeterminate') {
    setSelectedScopes((prev) =>
      checked === true ? [...prev, providerName] : prev.filter((s) => s !== providerName)
    );
  }

  const handleSubmit = () => {
    doExportOnBehalf(
      { subjectUserId, scopes: selectedScopes.length > 0 ? selectedScopes : null },
      {
        onSuccess: () => {
          toast.success(
            t('Privacy.AdminDsr.SuccessToast', {
              subjectUserId,
              defaultValue: 'Export requested for user {{subjectUserId}}.',
            })
          );
          setSubjectUserId('');
          setSelectedScopes([]);
        },
      }
    );
  };

  return (
    <div data-slot="privacy-admin-dsr-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Privacy.AdminDsr.Title', 'Admin DSR — Export on Behalf Of')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'Privacy.AdminDsr.Subtitle',
            'Trigger a personal data export for a specific data subject. Requires'
          )}{' '}
          <code className="text-xs">Privacy.Exports.ExecuteOnBehalfOf</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Privacy.AdminDsr.RequestTitle', 'Request Export')}</CardTitle>
          <CardDescription>
            {t(
              'Privacy.AdminDsr.RequestDescription',
              'The export is queued immediately. The subject will receive their data archive once processing completes.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="dsr-subject-user-id">
              {t('Privacy.AdminDsr.SubjectUserId', 'Subject User ID')}
            </Label>
            <Input
              id="dsr-subject-user-id"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={subjectUserId}
              onChange={(e) => setSubjectUserId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('Privacy.AdminDsr.ScopesLabel', 'Scopes')}{' '}
              <span className="font-normal text-muted-foreground">
                {t('Privacy.AdminDsr.ScopesHint', '(empty = all defaults)')}
              </span>
            </p>
            {isLoadingScopes ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {scopes?.map((scope) => (
                  <div key={scope.providerName} className="flex items-center gap-2">
                    <Checkbox
                      id={`dsr-scope-${scope.providerName}`}
                      checked={selectedScopes.includes(scope.providerName)}
                      onCheckedChange={(checked) => handleScopeChange(scope.providerName, checked)}
                    />
                    <Label
                      htmlFor={`dsr-scope-${scope.providerName}`}
                      className="cursor-pointer font-normal"
                    >
                      {scope.providerName}
                      {scope.defaultSelected && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {t('Privacy.AdminDsr.DefaultBadge', 'default')}
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={isPending || !subjectUserId.trim()}>
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            {t('Privacy.AdminDsr.RequestButton', 'Request Export')}
          </Button>

          {isSuccess && (
            <p className="text-sm text-muted-foreground">
              {t(
                'Privacy.AdminDsr.QueuedMessage',
                'Export queued. The subject will be notified when their archive is ready.'
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
