import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@granit/react-ui';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import type { ManagedHostnameResponse } from '@granit/hostnames';

export function DnsDetails({ hostname }: { readonly hostname: ManagedHostnameResponse }) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          {t('Hostnames.Actions.Details')}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2 rounded border border-border bg-muted/50 p-3 text-xs">
          {hostname.expectedDnsRecords.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-muted-foreground">{t('Hostnames.Dns.Records')}</p>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-1 pr-3 font-medium">{t('Hostnames.Dns.RecordType')}</th>
                    <th className="pb-1 pr-3 font-medium">{t('Hostnames.Dns.Name')}</th>
                    <th className="pb-1 font-medium">{t('Hostnames.Dns.Value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {hostname.expectedDnsRecords.map((rec) => (
                    <tr key={`${rec.recordType}-${rec.name}-${rec.value}`}>
                      <td className="pr-3 font-mono">{rec.recordType}</td>
                      <td className="pr-3 font-mono">{rec.name}</td>
                      <td className="font-mono">{rec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {hostname.conflicts.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-destructive">{t('Hostnames.Dns.Conflicts')}</p>
              <ul className="list-inside list-disc space-y-0.5 text-destructive">
                {hostname.conflicts.map((c) => (
                  <li key={`${c.conflictType}-${c.details ?? ''}`}>
                    <span className="font-medium">{t(`Hostnames.Conflict.${c.conflictType}`)}</span>
                    {c.details ? ` — ${c.details}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hostname.verificationToken && (
            <div>
              <p className="font-medium text-muted-foreground">
                {t('Hostnames.VerificationToken')}
              </p>
              <p className="font-mono">{hostname.verificationToken}</p>
            </div>
          )}
          {(hostname.certExpiresAt || hostname.failedCheckCount > 0) && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
              {hostname.certExpiresAt && (
                <>
                  <dt className="font-medium text-muted-foreground">
                    {t('Hostnames.Certificate.Expires')}
                  </dt>
                  <dd>{formatDateTime(hostname.certExpiresAt)}</dd>
                </>
              )}
              {hostname.failedCheckCount > 0 && (
                <>
                  <dt className="font-medium text-muted-foreground">
                    {t('Hostnames.FailedChecks')}
                  </dt>
                  <dd className="text-destructive">{hostname.failedCheckCount}</dd>
                </>
              )}
            </dl>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
