import { useArchiveProduct, usePublishProduct } from '@granit/react-catalog';
import { useTranslation } from '@granit/react-localization';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
  toast,
} from '@granit/react-ui';
import { buildLifecycleTransitionPrompt } from '@granit/react-workflow';
import { WorkflowLifecycleStatus, type WorkflowLifecycleStatusValue } from '@granit/workflow';
import { Archive, Loader2, Send } from 'lucide-react';
import { useState } from 'react';

import type { ProductResponse } from '@granit/catalog';

interface Props {
  product: ProductResponse;
}

type Kind = 'publish' | 'archive';

const STATUS_FROM_LABEL: Record<ProductResponse['lifecycleStatus'], WorkflowLifecycleStatusValue> =
  {
    Draft: WorkflowLifecycleStatus.Draft,
    Published: WorkflowLifecycleStatus.Published,
    Archived: WorkflowLifecycleStatus.Archived,
  };

const TOAST_KEYS: Record<Kind, { readonly success: string; readonly error: string }> = {
  publish: { success: 'Catalog.PublishSuccess', error: 'Catalog.PublishError' },
  archive: { success: 'Catalog.ArchiveSuccess', error: 'Catalog.ArchiveError' },
};

const ICONS: Record<Kind, typeof Send> = {
  publish: Send,
  archive: Archive,
};

/**
 * Lifecycle action buttons for a product. Each click opens an AlertDialog
 * built from `buildLifecycleTransitionPrompt` (framework metadata) so the
 * wording + severity are consistent with future modules (Invoicing, Parties,
 * …) that ship `WorkflowLifecycleStatus`-driven entities.
 *
 * - Draft   → Publish (info, no strong confirm)
 * - Published → Archive (destructive, strong confirm — the user must retype
 *   the product name before the action enables)
 * - Archived → no action available (terminal state)
 */
export function LifecycleActions({ product }: Readonly<Props>) {
  const { t } = useTranslation();
  const { t: tWorkflow } = useTranslation('workflow');
  const publish = usePublishProduct();
  const archive = useArchiveProduct();

  const [openAction, setOpenAction] = useState<Kind | null>(null);
  const [strongConfirmInput, setStrongConfirmInput] = useState('');

  if (product.lifecycleStatus === 'Archived') {
    return null;
  }

  const kind: Kind = product.lifecycleStatus === 'Draft' ? 'publish' : 'archive';
  const mutation = kind === 'publish' ? publish : archive;
  const toStatus =
    kind === 'publish' ? WorkflowLifecycleStatus.Published : WorkflowLifecycleStatus.Archived;
  const prompt = buildLifecycleTransitionPrompt(
    STATUS_FROM_LABEL[product.lifecycleStatus],
    toStatus
  );
  const Icon = ICONS[kind];
  const isStrongConfirmSatisfied =
    !prompt.requiresStrongConfirm || strongConfirmInput.trim() === product.name;

  const closeDialog = () => {
    setOpenAction(null);
    setStrongConfirmInput('');
  };

  const runMutation = () => {
    // On error the dialog stays open (no onError handler) so the user can retry;
    // API errors are surfaced by the global MutationCache.onError toast.
    mutation.mutate(product.id, {
      onSuccess: () => {
        toast.success(t(TOAST_KEYS[kind].success));
        closeDialog();
      },
    });
  };

  // Publish buttons stay primary; any destructive transition (today: archive)
  // surfaces as an outline button so the destructive intent shows in the
  // dialog (red confirm) rather than the trigger.
  const buttonVariant: 'default' | 'outline' =
    kind === 'publish' && prompt.severity !== 'destructive' ? 'default' : 'outline';

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={() => setOpenAction(kind)}
        disabled={mutation.isPending}
      >
        <Icon className="size-4" />
        {t(kind === 'publish' ? 'Catalog.Actions.Publish' : 'Catalog.Actions.Archive')}
      </Button>

      <AlertDialog open={openAction === kind} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent data-slot={`catalog-${kind}-dialog`} data-severity={prompt.severity}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tWorkflow(prompt.titleKey)}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span className="block font-medium text-foreground">{product.name}</span>
                <span className="mt-2 block">{tWorkflow(prompt.descriptionKey)}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {prompt.requiresStrongConfirm && (
            <div className="space-y-2" data-slot="strong-confirm">
              <Label htmlFor="strong-confirm-input" className="text-sm">
                {t('Catalog.StrongConfirmInstruction', { name: product.name })}
              </Label>
              <Input
                id="strong-confirm-input"
                value={strongConfirmInput}
                onChange={(e) => setStrongConfirmInput(e.target.value)}
                placeholder={product.name}
                disabled={mutation.isPending}
                autoComplete="off"
                aria-label={t('Catalog.StrongConfirmAriaLabel')}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              {t('Common.Cancel')}
            </AlertDialogCancel>
            {/*
             * Plain Button instead of AlertDialogAction: Radix's
             * AlertDialogAction closes the dialog on click by default,
             * which would dismiss the dialog before the user can retry
             * after a mutation error. The dialog open state stays under
             * our control via `openAction`.
             */}
            <Button
              variant={prompt.severity === 'destructive' ? 'destructive' : 'default'}
              onClick={runMutation}
              disabled={mutation.isPending || !isStrongConfirmSatisfied}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {tWorkflow(prompt.confirmLabelKey)}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
