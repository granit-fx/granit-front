import { useCheckAvailability, useCreateHostname } from '@granit/react-hostnames';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@granit/react-ui';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AddHostnameDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly ownerType: string;
  readonly ownerId: string;
}

export function AddHostnameDialog({
  open,
  onOpenChange,
  ownerType,
  ownerId,
}: AddHostnameDialogProps) {
  const { t } = useTranslation();
  const [host, setHost] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [checkHost, setCheckHost] = useState('');

  const {
    data: availability,
    isFetching: isChecking,
    refetch: recheck,
  } = useCheckAvailability(checkHost);
  const createMutation = useCreateHostname();

  function handleOpenChange(value: boolean) {
    if (!value) {
      setHost('');
      setIsPrimary(false);
      setCheckHost('');
    }
    onOpenChange(value);
  }

  function handleCheck() {
    if (!host) return;
    if (checkHost === host) {
      recheck();
    } else {
      setCheckHost(host);
    }
  }

  function handleAdd() {
    if (!host || !ownerType || !ownerId) return;
    const isValidHost =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(
        host
      );
    if (!isValidHost) {
      toast.error(t('Hostnames.AddDialog.InvalidHost'));
      return;
    }
    createMutation.mutate(
      { host, ownerType, ownerId, isPrimary },
      {
        onSuccess: () => {
          toast.success(t('Hostnames.AddSuccess'));
          handleOpenChange(false);
        },
      }
    );
  }

  const availabilityResult =
    availability && checkHost === host ? (
      <span
        className={
          availability.isAvailable
            ? 'flex items-center gap-1 text-success-600'
            : 'flex items-center gap-1 text-destructive'
        }
      >
        {availability.isAvailable ? (
          <>
            <CheckCircle2 className="size-3.5" />
            {t('Hostnames.AddDialog.Available')}
          </>
        ) : (
          <>
            <XCircle className="size-3.5" />
            {t('Hostnames.AddDialog.Unavailable')}
          </>
        )}
      </span>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-slot="add-hostname-dialog">
        <DialogHeader>
          <DialogTitle>{t('Hostnames.AddDialog.Title')}</DialogTitle>
          <DialogDescription>{t('Hostnames.AddDialog.Description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="add-host">{t('Hostnames.AddDialog.Host')}</Label>
            <div className="flex gap-2">
              <Input
                id="add-host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder={t('Hostnames.AddDialog.HostPlaceholder')}
                className="font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!host || isChecking}
                onClick={handleCheck}
              >
                {isChecking ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  t('Hostnames.AddDialog.CheckAvailability')
                )}
              </Button>
            </div>
            {availabilityResult}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="add-is-primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(Boolean(checked))}
            />
            <Label htmlFor="add-is-primary">{t('Hostnames.AddDialog.IsPrimary')}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('Hostnames.AddDialog.Cancel')}
          </Button>
          <Button onClick={handleAdd} disabled={!host || createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {t('Hostnames.AddDialog.Add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
