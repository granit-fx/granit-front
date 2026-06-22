import { useDeleteFeatureOverride, useSetFeatureOverride } from '@granit/react-features';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@granit/react-ui';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { FeatureDefinitionResponse, FeatureValueResponse } from '@granit/features';

interface SetOverrideDialogProps {
  readonly definition: FeatureDefinitionResponse;
  readonly currentValue: FeatureValueResponse;
}

export function SetOverrideDialog({ definition, currentValue }: SetOverrideDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentValue.value);

  const setOverride = useSetFeatureOverride();
  const deleteOverride = useDeleteFeatureOverride();

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setValue(currentValue.value);
      }
      setOpen(next);
    },
    [currentValue.value]
  );

  const handleSubmit = useCallback(() => {
    setOverride.mutate(
      { name: definition.name, request: { value } },
      {
        onSuccess: () => {
          toast.success(t('Features.Override.SetSuccess'));
          setOpen(false);
        },
      }
    );
  }, [definition.name, value, setOverride, t]);

  const handleRemoveOverride = useCallback(() => {
    deleteOverride.mutate(definition.name, {
      onSuccess: () => {
        toast.success(t('Features.Override.RemoveSuccess'));
        setOpen(false);
      },
    });
  }, [definition.name, deleteOverride, t]);

  const isPending = setOverride.isPending || deleteOverride.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t('Features.Override.Configure')}
        </Button>
      </DialogTrigger>
      <DialogContent data-slot="set-override-dialog">
        <DialogHeader>
          <DialogTitle>{t('Features.Override.Title')}</DialogTitle>
          <DialogDescription>{definition.displayName ?? definition.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {definition.valueType === 'Toggle' && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="feature-toggle">{t('Features.Override.Value')}</Label>
              <Switch
                id="feature-toggle"
                checked={value === 'true'}
                onCheckedChange={(checked) => setValue(checked ? 'true' : 'false')}
              />
            </div>
          )}

          {definition.valueType === 'Numeric' && (
            <div className="space-y-2">
              <Label htmlFor="feature-numeric">{t('Features.Override.Value')}</Label>
              <Input
                id="feature-numeric"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min={definition.numericConstraint?.min}
                max={definition.numericConstraint?.max}
              />
              {definition.numericConstraint && (
                <p className="text-xs text-muted-foreground">
                  {t('Features.Override.NumericRange', {
                    min: definition.numericConstraint.min,
                    max: definition.numericConstraint.max,
                  })}
                </p>
              )}
            </div>
          )}

          {definition.valueType === 'Selection' && definition.selectionValues && (
            <div className="space-y-2">
              <Label htmlFor="feature-selection">{t('Features.Override.Value')}</Label>
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger id="feature-selection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {definition.selectionValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="destructive"
            onClick={handleRemoveOverride}
            disabled={isPending}
            className="sm:mr-auto"
          >
            {t('Features.Override.Remove')}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {t('Common.Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {t('Features.Override.Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
