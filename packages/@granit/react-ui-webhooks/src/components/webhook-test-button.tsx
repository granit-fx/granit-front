import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Check, Loader2, Send, X } from 'lucide-react';

import type { WebhookSubscriptionTestPingResponse } from '@granit/webhooks';

interface WebhookTestButtonProps {
  onTest: () => void;
  isPending?: boolean;
  result?: WebhookSubscriptionTestPingResponse | null;
  className?: string;
}

export function WebhookTestButton({
  onTest,
  isPending = false,
  result = null,
  className,
}: Readonly<WebhookTestButtonProps>) {
  const { t } = useTranslation();

  return (
    <div data-slot="webhook-test-button" className={cn('flex items-center gap-2', className)}>
      <Button variant="outline" size="sm" onClick={onTest} disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-1 size-3.5 animate-spin" />
        ) : (
          <Send className="mr-1 size-3.5" />
        )}
        {t('Webhooks.Actions.SendTest')}
      </Button>

      {result && (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-sm',
            result.success ? 'text-green-600' : 'text-destructive'
          )}
        >
          {result.success ? <Check className="size-3.5" /> : <X className="size-3.5" />}
          {result.httpStatusCode} — {result.durationMs}ms
        </span>
      )}
    </div>
  );
}
