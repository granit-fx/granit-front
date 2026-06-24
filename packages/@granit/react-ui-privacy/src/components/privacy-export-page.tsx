import { downloadExport } from '@granit/privacy';
import { useTranslation } from '@granit/react-localization';
import {
  useExportScopes,
  usePrivacyConfig,
  usePrivacyExports,
  useRequestExport,
  useRequestExportOnBehalfOf,
} from '@granit/react-privacy';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { Download, FileArchive, Loader2, Send } from 'lucide-react';
import { useState } from 'react';

import type { PrivacyExportStatus } from '@granit/privacy';

function ExportStatusBadge({ status }: Readonly<{ status: PrivacyExportStatus }>) {
  const { t } = useTranslation();

  const variants: Record<PrivacyExportStatus, 'default' | 'secondary' | 'destructive' | 'outline'> =
    {
      Pending: 'secondary',
      Completed: 'default',
      PartiallyCompleted: 'outline',
      TimedOut: 'destructive',
    };

  return <Badge variant={variants[status]}>{t(`Privacy.Export.Status.${status}`)}</Badge>;
}

export function PrivacyExportPage() {
  const { t } = useTranslation();
  const { client, basePath } = usePrivacyConfig();
  const { data: exports, isLoading } = usePrivacyExports();
  const { mutate: doExport, isPending: isExporting } = useRequestExport();
  const { data: scopes, isLoading: isLoadingScopes } = useExportScopes();
  const { mutate: doExportOnBehalf, isPending: isExportingOnBehalf } = useRequestExportOnBehalfOf();

  const [subjectUserId, setSubjectUserId] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  function handleScopeChange(providerName: string, checked: boolean | 'indeterminate') {
    setSelectedScopes((prev) =>
      checked === true ? [...prev, providerName] : prev.filter((s) => s !== providerName)
    );
  }

  async function handleDownload(requestId: string) {
    // basePath is always set by PrivacyProvider (defaults to DEFAULT_BASE_PATH);
    // the config type marks it optional, so assert it like the framework hooks do.
    const stream = await downloadExport(client, basePath!, requestId);
    const blob = await new Response(stream).blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `privacy-export-${requestId}.zip`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-slot="privacy-export-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Privacy.Export.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Privacy.Export.Subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Privacy.Export.RequestTitle')}</CardTitle>
          <CardDescription>{t('Privacy.Export.RequestDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => doExport()} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileArchive className="mr-2 size-4" />
            )}
            {t('Privacy.Export.RequestButton')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Privacy.Export.HistoryTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && (!exports || exports.length === 0) && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('Privacy.Export.NoExports')}
            </p>
          )}
          {!isLoading && exports && exports.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Privacy.Export.Columns.Id')}</TableHead>
                  <TableHead>{t('Privacy.Export.Columns.Status')}</TableHead>
                  <TableHead>{t('Privacy.Export.Columns.Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((item) => (
                  <TableRow key={item.requestId}>
                    <TableCell className="font-mono text-sm">{item.requestId}</TableCell>
                    <TableCell>
                      <ExportStatusBadge status={item.state} />
                    </TableCell>
                    <TableCell>
                      {item.state === 'Completed' && item.archiveBlobReferenceId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            void handleDownload(item.requestId);
                          }}
                        >
                          <Download className="mr-2 size-4" />
                          {t('Privacy.Export.Download')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Privacy.Export.ScopesTitle', 'Available Export Scopes')}</CardTitle>
          <CardDescription>
            {t('Privacy.Export.ScopesDescription', 'Data providers included in an export request.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingScopes && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoadingScopes && (!scopes || scopes.length === 0) && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('Privacy.Export.NoScopes', 'No scopes available.')}
            </p>
          )}
          {!isLoadingScopes && scopes && scopes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Privacy.Export.ScopeColumns.Provider', 'Provider')}</TableHead>
                  <TableHead>{t('Privacy.Export.ScopeColumns.Feature', 'Feature')}</TableHead>
                  <TableHead>
                    {t('Privacy.Export.ScopeColumns.SelectedByDefault', 'Selected by Default')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopes.map((scope) => (
                  <TableRow key={scope.providerName}>
                    <TableCell className="font-mono text-sm">{scope.providerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {scope.featureName ?? '—'}
                    </TableCell>
                    <TableCell>
                      {scope.defaultSelected ? (
                        <Badge variant="default">
                          {t('Privacy.Export.ScopeBadge.Default', 'Default')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {t('Privacy.Export.ScopeBadge.Optional', 'Optional')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Privacy.Export.OnBehalfTitle', 'Export for Another User')}</CardTitle>
          <CardDescription>
            {t(
              'Privacy.Export.OnBehalfDescription',
              'Trigger a data export on behalf of a subject (admin DSR). Requires'
            )}{' '}
            <code className="text-xs">Privacy.Exports.ExecuteOnBehalfOf</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject-user-id">
              {t('Privacy.Export.SubjectUserId', 'Subject User ID')}
            </Label>
            <Input
              id="subject-user-id"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={subjectUserId}
              onChange={(e) => setSubjectUserId(e.target.value)}
            />
          </div>

          {!isLoadingScopes && scopes && scopes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t('Privacy.Export.ScopesOptionalLabel', 'Scopes (optional — leave empty for all)')}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {scopes.map((scope) => (
                  <div key={scope.providerName} className="flex items-center gap-2">
                    <Checkbox
                      id={`scope-${scope.providerName}`}
                      checked={selectedScopes.includes(scope.providerName)}
                      onCheckedChange={(checked) => handleScopeChange(scope.providerName, checked)}
                    />
                    <Label
                      htmlFor={`scope-${scope.providerName}`}
                      className="cursor-pointer font-normal"
                    >
                      {scope.providerName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              doExportOnBehalf(
                {
                  subjectUserId,
                  scopes: selectedScopes.length > 0 ? selectedScopes : null,
                },
                {
                  onSuccess: () => {
                    setSubjectUserId('');
                    setSelectedScopes([]);
                  },
                }
              );
            }}
            disabled={isExportingOnBehalf || !subjectUserId.trim()}
          >
            {isExportingOnBehalf ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            {t('Privacy.Export.OnBehalfButton', 'Request Export')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
