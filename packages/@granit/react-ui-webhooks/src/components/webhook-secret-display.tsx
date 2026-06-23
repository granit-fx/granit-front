import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Check, ClipboardCopy, Eye, EyeOff, RefreshCw, Terminal } from 'lucide-react';
import { useCallback, useState } from 'react';

interface WebhookSecretDisplayProps {
  secret: string;
  targetUrl?: string;
  onRotate?: () => void;
  isRotating?: boolean;
  isOneTime?: boolean;
  /** When false, the secret is a placeholder — hide reveal/copy buttons. */
  canReveal?: boolean;
  className?: string;
}

export function WebhookSecretDisplay({
  secret,
  targetUrl,
  onRotate,
  isRotating = false,
  isOneTime = false,
  canReveal = true,
  className,
}: Readonly<WebhookSecretDisplayProps>) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(isOneTime);
  const [copied, setCopied] = useState<'secret' | 'curl' | null>(null);

  const handleCopy = useCallback(
    async (type: 'secret' | 'curl') => {
      const text =
        type === 'curl' && targetUrl
          ? `curl -X POST ${targetUrl} -H "Content-Type: application/json" -H "X-Webhook-Signature: $(echo -n '{}' | openssl dgst -sha256 -hmac '${secret}' -binary | base64)" -d '{}'`
          : secret;

      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    },
    [secret, targetUrl]
  );

  return (
    <div data-slot="webhook-secret-display" className={cn('space-y-3', className)}>
      {isOneTime && (
        <p className="text-sm font-medium text-destructive">
          {t('Webhooks.Secret.OneTimeWarning')}
        </p>
      )}

      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
        <code className="flex-1 min-w-0 break-all text-sm font-mono">
          {isVisible || !canReveal ? secret : '•'.repeat(Math.min(secret.length, 40))}
        </code>

        {canReveal && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible((v) => !v)}
            aria-label={t(isVisible ? 'Webhooks.Secret.Hide' : 'Webhooks.Secret.Show')}
          >
            {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        )}

        {canReveal && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy('secret')}
            aria-label={t('Webhooks.Secret.CopySecret')}
          >
            {copied === 'secret' ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <ClipboardCopy className="size-4" />
            )}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {canReveal && targetUrl && (
          <Button variant="outline" size="sm" onClick={() => handleCopy('curl')}>
            {copied === 'curl' ? (
              <Check className="mr-1 size-3.5 text-green-600" />
            ) : (
              <Terminal className="mr-1 size-3.5" />
            )}
            {t('Webhooks.Actions.CopyCurl')}
          </Button>
        )}

        {onRotate && !isOneTime && (
          <Button variant="outline" size="sm" onClick={onRotate} disabled={isRotating}>
            <RefreshCw className={cn('mr-1 size-3.5', isRotating && 'animate-spin')} />
            {t('Webhooks.Actions.RotateSecret')}
          </Button>
        )}
      </div>
    </div>
  );
}
