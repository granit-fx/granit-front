import { useEntityDiscovery } from '@granit/react-entities';
import {
  useCreateEntityView,
  useDeleteEntityView,
  useSetEntityViewPersonalDefault,
  useSetEntityViewPinned,
  useSetEntityViewTenantDefault,
  useUpdateEntityView,
  useEntityViews,
} from '@granit/react-entities-views';
import { useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@granit/react-ui';
import { Globe, Pencil, Pin, PinOff, Star, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type {
  EntityViewCreateBodyRequest,
  EntityViewResponse,
  EntityViewUpdateBodyRequest,
  EntityViewVisibility,
} from '@granit/entities-views';

const VIEW_KINDS = ['list', 'kanban', 'calendar', 'gallery'] as const;
type ViewKind = (typeof VIEW_KINDS)[number];

const VISIBILITY_ICON: Record<EntityViewVisibility, React.ReactNode> = {
  Personal: <Users size={12} className="inline-block" />,
  Shared: <Users size={12} className="inline-block" />,
  Tenant: <Globe size={12} className="inline-block" />,
};
const VISIBILITY_VARIANT: Record<EntityViewVisibility, 'default' | 'secondary' | 'outline'> = {
  Personal: 'outline',
  Shared: 'secondary',
  Tenant: 'default',
};

// ── Create dialog ────────────────────────────────────────────────────────────

interface CreateDialogProps {
  readonly entityName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function CreateViewDialog({ entityName, open, onOpenChange }: CreateDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ViewKind>('list');
  const mutation = useCreateEntityView(entityName);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const body: EntityViewCreateBodyRequest = {
      basedOn: `${entityName}:default`,
      kind,
      name: name.trim(),
      description: null,
      icon: null,
      state: {},
    };
    mutation.mutate(body, {
      onSuccess: () => {
        toast.success(t('views:Create.Success', { defaultValue: 'View created' }));
        setName('');
        setKind('list');
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('views:Create.Title', { defaultValue: 'New view' })}</DialogTitle>
        </DialogHeader>
        <form id="create-view-form" onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('views:Field.Name', { defaultValue: 'Name' })}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('views:Field.NamePlaceholder', { defaultValue: 'My view' })}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('views:Field.Kind', { defaultValue: 'Kind' })}
            </label>
            <Select value={kind} onValueChange={(v) => setKind(v as ViewKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`views:Kind.${k}`, { defaultValue: k })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.Cancel', 'Cancel')}
          </Button>
          <Button type="submit" form="create-view-form" disabled={mutation.isPending}>
            {mutation.isPending ? t('Common.Saving', 'Saving…') : t('Common.Create', 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  readonly entityName: string;
  readonly view: EntityViewResponse | null;
  readonly onOpenChange: (open: boolean) => void;
}

function EditViewDialog({ entityName, view, onOpenChange }: EditDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(view?.name ?? '');
  const [description, setDescription] = useState(view?.description ?? '');
  const mutation = useUpdateEntityView(entityName);

  // Sync local state when the view prop changes (new view opened for edit).
  if (view && name !== view.name && !mutation.isPending) {
    setName(view.name);
    setDescription(view.description ?? '');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!view || !name.trim()) return;
    const body: EntityViewUpdateBodyRequest = {
      name: name.trim(),
      description: description.trim() || null,
      icon: view.icon,
      state: view.state,
    };
    mutation.mutate(
      { id: view.id, request: body },
      {
        onSuccess: () => {
          toast.success(t('views:Edit.Success', { defaultValue: 'View updated' }));
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={view !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('views:Edit.Title', { defaultValue: 'Edit view' })}</DialogTitle>
        </DialogHeader>
        <form id="edit-view-form" onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('views:Field.Name', { defaultValue: 'Name' })}
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('views:Field.Description', { defaultValue: 'Description' })}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('views:Field.DescriptionPlaceholder', {
                defaultValue: 'Optional description',
              })}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.Cancel', 'Cancel')}
          </Button>
          <Button type="submit" form="edit-view-form" disabled={mutation.isPending}>
            {mutation.isPending ? t('Common.Saving', 'Saving…') : t('Common.Save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Views table ──────────────────────────────────────────────────────────────

interface ViewRowProps {
  readonly entityName: string;
  readonly view: EntityViewResponse;
  readonly onEdit: (view: EntityViewResponse) => void;
  readonly onDelete: (id: string) => void;
}

function ViewRow({ entityName, view, onEdit, onDelete }: ViewRowProps) {
  const { t } = useTranslation();
  const pinMutation = useSetEntityViewPinned(entityName);
  const defaultMutation = useSetEntityViewTenantDefault(entityName);
  const personalMutation = useSetEntityViewPersonalDefault(entityName);

  const isAnyPending =
    pinMutation.isPending || defaultMutation.isPending || personalMutation.isPending;

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{view.name}</span>
          <Badge variant={VISIBILITY_VARIANT[view.visibility]} className="gap-1 text-xs">
            {VISIBILITY_ICON[view.visibility]}
            {view.visibility}
          </Badge>
          <span className="text-xs text-muted-foreground">{view.kind}</span>
        </div>
        {view.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{view.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={
            view.isPinned
              ? t('views:Action.Unpin', { defaultValue: 'Unpin' })
              : t('views:Action.Pin', { defaultValue: 'Pin' })
          }
          disabled={isAnyPending}
          onClick={() => pinMutation.mutate({ id: view.id, value: !view.isPinned })}
        >
          {view.isPinned ? <Pin size={14} className="text-primary" /> : <PinOff size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={
            view.isDefault
              ? t('views:Action.UnsetDefault', { defaultValue: 'Remove tenant default' })
              : t('views:Action.SetDefault', { defaultValue: 'Set as tenant default' })
          }
          disabled={isAnyPending}
          onClick={() => defaultMutation.mutate({ id: view.id, value: !view.isDefault })}
        >
          <Globe size={14} className={view.isDefault ? 'text-primary' : 'text-muted-foreground'} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={
            view.isPersonalDefault
              ? t('views:Action.UnsetPersonalDefault', { defaultValue: 'Remove personal default' })
              : t('views:Action.SetPersonalDefault', { defaultValue: 'Set as personal default' })
          }
          disabled={isAnyPending}
          onClick={() => personalMutation.mutate({ id: view.id, value: !view.isPersonalDefault })}
        >
          <Star
            size={14}
            className={
              view.isPersonalDefault ? 'fill-primary text-primary' : 'text-muted-foreground'
            }
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={t('views:Action.Edit', { defaultValue: 'Edit' })}
          onClick={() => onEdit(view)}
        >
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          title={t('views:Action.Delete', { defaultValue: 'Delete' })}
          onClick={() => onDelete(view.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export function EntityViewsTab() {
  const { t } = useTranslation();
  const { data: discovery } = useEntityDiscovery();
  const entities = (discovery?.modules ?? []).flatMap((m) => m.items);
  const [entityName, setEntityName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingView, setEditingView] = useState<EntityViewResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: views, isLoading } = useEntityViews(entityName);
  const deleteMutation = useDeleteEntityView(entityName);

  function handleConfirmDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        toast.success(t('views:Delete.Success', { defaultValue: 'View deleted' }));
        setDeletingId(null);
      },
      onError: () => {
        // API errors are surfaced by the global MutationCache.onError toast.
        setDeletingId(null);
      },
    });
  }

  const viewsContent = (() => {
    if (entityName) {
      if (isLoading) return <Spinner />;
      if (views?.length) {
        return (
          <div className="space-y-2">
            {views.map((view: EntityViewResponse) => (
              <ViewRow
                key={view.id}
                entityName={entityName}
                view={view}
                onEdit={setEditingView}
                onDelete={setDeletingId}
              />
            ))}
          </div>
        );
      }
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('views:Page.Empty', {
            defaultValue: 'No views yet for this entity.',
          })}
        </p>
      );
    }
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('views:Page.PickEntity', { defaultValue: 'Pick an entity to see its views.' })}
      </p>
    );
  })();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('views:Page.Title', { defaultValue: 'Saved views' })}</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={entityName} onValueChange={setEntityName}>
              <SelectTrigger className="w-[280px]">
                <SelectValue
                  placeholder={t('customization:Picker.SelectEntity', 'Select entity')}
                />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e: { readonly name: string }) => (
                  <SelectItem key={e.name} value={e.name}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!entityName} onClick={() => setCreateOpen(true)}>
              {t('views:Action.NewView', { defaultValue: 'New view' })}
            </Button>
          </div>
        </CardHeader>
        <CardContent>{viewsContent}</CardContent>
      </Card>

      {entityName && (
        <CreateViewDialog entityName={entityName} open={createOpen} onOpenChange={setCreateOpen} />
      )}

      {entityName && (
        <EditViewDialog
          entityName={entityName}
          view={editingView}
          onOpenChange={(open) => !open && setEditingView(null)}
        />
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('views:Delete.ConfirmTitle', { defaultValue: 'Delete this view?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('views:Delete.ConfirmBody', {
                defaultValue: 'This action cannot be undone.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Common.Cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Common.Delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
