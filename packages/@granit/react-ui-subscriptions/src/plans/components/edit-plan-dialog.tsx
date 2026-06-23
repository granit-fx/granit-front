import { useTranslation } from '@granit/react-localization';
import { useUpdatePlan } from '@granit/react-subscriptions';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { useState, type FormEvent } from 'react';

import type { PlanId } from '@granit/subscriptions';

interface EditPlanDialogProps {
  readonly planId: string;
  readonly defaultName: string;
  readonly defaultDescription: string | null;
  readonly defaultSortOrder: number;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function EditPlanDialog({
  planId,
  defaultName,
  defaultDescription,
  defaultSortOrder,
  open,
  onOpenChange,
}: EditPlanDialogProps) {
  const { t } = useTranslation();
  const updatePlan = useUpdatePlan();

  // DialogContent unmounts on close — state initializes fresh from props on every open.
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription ?? '');
  const [sortOrder, setSortOrder] = useState(String(defaultSortOrder));

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updatePlan.mutate(
      {
        id: toEntityId<'Plan'>(planId) as PlanId,
        request: {
          name,
          description: description.trim() || null,
          sortOrder: Number(sortOrder),
        },
      },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.Plans.EditSuccess'));
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Subscriptions.Plans.Edit')}</DialogTitle>
          <DialogDescription>{t('Subscriptions.Plans.EditDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-plan-name">{t('Subscriptions.Plans.Form.Name')}</Label>
            <Input
              id="edit-plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-plan-description">
              {t('Subscriptions.Plans.Form.Description')}
            </Label>
            <Textarea
              id="edit-plan-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-plan-sort-order">{t('Subscriptions.Plans.Form.SortOrder')}</Label>
            <Input
              id="edit-plan-sort-order"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('Subscriptions.Plans.Form.SortOrderHint')}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updatePlan.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={updatePlan.isPending || !name.trim()}>
              {updatePlan.isPending ? t('Common.Loading') : t('Common.Save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
