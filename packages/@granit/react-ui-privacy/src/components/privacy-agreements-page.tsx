import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  useAcceptAgreement,
  useAgreementDocuments,
  useAgreementHistory,
  useAgreementStatuses,
} from '@granit/react-privacy';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { Check, FileText, History, Loader2 } from 'lucide-react';
import { useState } from 'react';

import type { PrivacyUserAgreementResponse } from '@granit/privacy';

export function PrivacyAgreementsPage() {
  const { t } = useTranslation();
  const { data: legalDocuments, isLoading: isLoadingDocuments } = useAgreementDocuments();
  const { data: agreementStatuses } = useAgreementStatuses();
  const { data: agreementHistory } = useAgreementHistory();
  const { mutate: doAccept, isPending: isAccepting } = useAcceptAgreement();

  const [historyDialogDocumentId, setHistoryDialogDocumentId] = useState<string | null>(null);

  const getStatus = (documentId: string) =>
    agreementStatuses?.find((s) => s.documentId === documentId);

  const getDocumentHistory = (documentId: string): PrivacyUserAgreementResponse[] =>
    agreementHistory?.filter((h) => h.documentId === documentId) ?? [];

  const { formatDateTime } = useDateFormatter();

  return (
    <div data-slot="privacy-agreements-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Privacy.Agreements.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Privacy.Agreements.Subtitle')}</p>
      </div>

      {isLoadingDocuments && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoadingDocuments && (!legalDocuments || legalDocuments.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t('Privacy.Agreements.NoDocuments')}
          </CardContent>
        </Card>
      )}
      {!isLoadingDocuments && legalDocuments && legalDocuments.length > 0 && (
        <div className="grid gap-4">
          {legalDocuments.map((doc) => {
            const status = getStatus(doc.documentId);
            const hasAccepted = status?.hasAcceptedLatest ?? false;

            return (
              <Card key={doc.documentId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="size-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{doc.displayName}</CardTitle>
                    </div>
                    {hasAccepted ? (
                      <Badge variant="default">
                        <Check className="mr-1 size-3" />
                        {t('Privacy.Agreements.Accepted')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{t('Privacy.Agreements.PendingAcceptance')}</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {t('Privacy.Agreements.Version', { version: doc.currentVersion })}
                    {status?.lastAcceptedAt && (
                      <>
                        {' — '}
                        {t('Privacy.Agreements.LastAccepted', {
                          date: formatDateTime(status.lastAcceptedAt),
                        })}
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  {!hasAccepted && (
                    <Button
                      onClick={() =>
                        doAccept({ documentId: doc.documentId, version: doc.currentVersion })
                      }
                      disabled={isAccepting}
                    >
                      {isAccepting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 size-4" />
                      )}
                      {t('Privacy.Agreements.AcceptButton')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setHistoryDialogDocumentId(doc.documentId)}
                  >
                    <History className="mr-2 size-4" />
                    {t('Privacy.Agreements.ViewHistory')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={historyDialogDocumentId !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryDialogDocumentId(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Privacy.Agreements.HistoryTitle')}</DialogTitle>
            <DialogDescription>{t('Privacy.Agreements.HistoryDescription')}</DialogDescription>
          </DialogHeader>
          {historyDialogDocumentId && (
            <>
              {getDocumentHistory(historyDialogDocumentId).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t('Privacy.Agreements.NoHistory')}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Privacy.Agreements.HistoryColumns.Version')}</TableHead>
                      <TableHead>{t('Privacy.Agreements.HistoryColumns.AcceptedAt')}</TableHead>
                      <TableHead>{t('Privacy.Agreements.HistoryColumns.Latest')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getDocumentHistory(historyDialogDocumentId).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.version}</TableCell>
                        <TableCell>{formatDateTime(entry.acceptedAt)}</TableCell>
                        <TableCell>
                          {entry.isLatest && (
                            <Badge variant="default">
                              <Check className="mr-1 size-3" />
                              {t('Privacy.Agreements.Current')}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
