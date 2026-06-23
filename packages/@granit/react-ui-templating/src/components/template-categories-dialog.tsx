import { useTranslation } from '@granit/react-localization';
import { useTemplateCategories, useTemplateCategoryMutations } from '@granit/react-templating';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from '@granit/react-ui';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from '../logger';

import type { TemplateCategory } from '@granit/templating';

interface TemplateCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateCategoriesDialog({
  open,
  onOpenChange,
}: Readonly<TemplateCategoriesDialogProps>) {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useTemplateCategories();
  const mutations = useTemplateCategoryMutations();
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (name: string, description: string) => {
    try {
      await mutations.create.mutateAsync({ name, description });
      toast.success(t('Templates.Messages.Saved'));
      setIsCreating(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TemplateCategoriesDialog] Create category failed', err);
    }
  };

  const handleUpdate = async (id: string, name: string, description: string) => {
    try {
      await mutations.update.mutateAsync({
        id,
        request: { name, description, sortOrder: editingCategory?.sortOrder ?? 0 },
      });
      toast.success(t('Templates.Messages.Saved'));
      setEditingCategory(null);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TemplateCategoriesDialog] Update category failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mutations.delete.mutateAsync(id);
      toast.success(t('Templates.Messages.DraftDeleted'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TemplateCategoriesDialog] Delete category failed', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="template-categories-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Templates.Categories.Title')}</DialogTitle>
          <DialogDescription>{t('Templates.Categories.Subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (
            categories?.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <span className="font-medium">{cat.name}</span>
                  {cat.description && (
                    <span className="ml-2 text-xs text-muted-foreground">{cat.description}</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({cat.templateCount} {t('Templates.Categories.TemplateCount').toLowerCase()})
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingCategory(cat)}
                    aria-label={t('Common.Edit')}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={cat.templateCount > 0}
                    onClick={() => handleDelete(cat.id)}
                    aria-label={t('Common.Delete')}
                    title={
                      cat.templateCount > 0 ? t('Templates.Categories.CannotDelete') : undefined
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {(isCreating || editingCategory) && (
          <CategoryInlineForm
            defaultName={editingCategory?.name ?? ''}
            defaultDescription={editingCategory?.description ?? ''}
            onSubmit={(name, description) => {
              if (editingCategory) {
                handleUpdate(editingCategory.id, name, description);
              } else {
                handleCreate(name, description);
              }
            }}
            onCancel={() => {
              setEditingCategory(null);
              setIsCreating(false);
            }}
          />
        )}

        {!isCreating && !editingCategory && (
          <Button variant="outline" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('Templates.Categories.Create')}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryInlineForm({
  defaultName,
  defaultDescription,
  onSubmit,
  onCancel,
}: Readonly<{
  defaultName: string;
  defaultDescription: string;
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
}>) {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);

  return (
    <div className="space-y-2 rounded border bg-muted p-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('Templates.Categories.Name')}
        className="bg-background"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('Templates.Categories.Description')}
        className="bg-background"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('Common.Cancel')}
        </Button>
        <Button
          size="sm"
          onClick={() => onSubmit(name.trim(), description.trim())}
          disabled={!name.trim()}
        >
          {t('Common.Save')}
        </Button>
      </div>
    </div>
  );
}
