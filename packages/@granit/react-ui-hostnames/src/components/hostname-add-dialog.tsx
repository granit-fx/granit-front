import { hostnamesConstraints } from '@granit/hostnames';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

// Client-only UX guard for a real FQDN. The contract carries only `maxLength` on
// `host` (the .NET endpoint runs the authoritative hostname check), so this regex
// is a front augmentation layered ON TOP of the spec-derived constraints — drop
// it once the backend exposes the pattern in contracts/openapi/hostnames.json.
const FQDN_RE =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

interface AddHostnameFormValues {
  readonly host: string;
  readonly isPrimary: boolean;
}

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
  const [checkHost, setCheckHost] = useState('');

  const {
    data: availability,
    isFetching: isChecking,
    refetch: recheck,
  } = useCheckAvailability(checkHost);
  const createMutation = useCreateHostname();

  // `host` validation = spec constraints (required, maxLength 253) plus the
  // client-only FQDN check above. `Validation:Builtin:*` messages are owned by
  // the backend `Granit.Validation` package (loaded by the host app).
  const baseResolver = createConstraintsResolver(
    hostnamesConstraints.CreateManagedHostnameRequest,
    t,
    { labelResolver: (field) => (field === 'host' ? t('Hostnames.AddDialog.Host') : field) }
  );
  const formResolver = (async (
    values: Record<string, unknown>,
    context: unknown,
    options: { fields: Record<string, { name: string }> }
  ) => {
    const result = await baseResolver(values, context, options);
    if (!result.errors.host && values.host && !FQDN_RE.test(String(values.host))) {
      result.errors.host = { type: 'fqdn', message: t('Hostnames.AddDialog.InvalidHost') };
    }
    return result;
  }) as unknown as Resolver<AddHostnameFormValues>;

  const form = useForm<AddHostnameFormValues>({
    resolver: formResolver,
    defaultValues: { host: '', isPrimary: false },
  });

  const host = form.watch('host');

  function handleOpenChange(value: boolean) {
    if (!value) {
      form.reset();
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

  function onSubmit(values: AddHostnameFormValues) {
    if (!ownerType || !ownerId) return;
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    createMutation.mutate(
      { host: values.host, ownerType, ownerId, isPrimary: values.isPrimary },
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Hostnames.AddDialog.Host')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('Hostnames.AddDialog.HostPlaceholder')}
                        className="font-mono"
                      />
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  </FormControl>
                  <FormLabel>{t('Hostnames.AddDialog.IsPrimary')}</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t('Hostnames.AddDialog.Cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {t('Hostnames.AddDialog.Add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
