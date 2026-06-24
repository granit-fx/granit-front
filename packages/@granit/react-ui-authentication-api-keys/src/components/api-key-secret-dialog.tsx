import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@granit/react-ui';
import { useCopyToClipboard } from '@granit/react-ui-kit';
import { AlertTriangle, Check, ClipboardCopy } from 'lucide-react';
import { useCallback } from 'react';

interface ApiKeySecretDialogProps {
  open: boolean;
  secret: string;
  onClose: () => void;
}

export function ApiKeySecretDialog({ open, secret, onClose }: Readonly<ApiKeySecretDialogProps>) {
  const { t } = useTranslation();
  const { copy, copied } = useCopyToClipboard();

  const handleCopy = useCallback(async () => {
    await copy(secret);
  }, [copy, secret]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        data-slot="api-key-secret-dialog"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{t('ApiKeys.CopySecret')}</DialogTitle>
          <DialogDescription className="flex items-start gap-2 pt-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span className="text-destructive font-medium">{t('ApiKeys.SecretWarning')}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <code className="flex-1 break-all font-mono text-sm">{secret}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              aria-label={t('ApiKeys.CopySecret')}
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <ClipboardCopy className="size-4" />
              )}
            </Button>
          </div>

          {copied && <p className="text-sm text-green-600">{t('ApiKeys.SecretCopied')}</p>}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t('ApiKeys.SecretConfirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
