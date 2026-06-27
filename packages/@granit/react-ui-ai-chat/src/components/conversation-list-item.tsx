import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
} from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface ConversationListItemProps {
  readonly id: string;
  readonly title: string;
  readonly isActive: boolean;
  readonly isPinned: boolean;
  readonly onSelect: () => void;
  readonly onTogglePin: () => void;
  /** Persist a new title. Rejecting keeps the dialog open. */
  readonly onRename: (title: string) => Promise<void> | void;
  /** Delete the conversation. Rejecting keeps the confirmation dialog open. */
  readonly onDelete: () => Promise<void> | void;
}

/**
 * A conversation row in the chat sidebar: click to open, plus a kebab menu to
 * pin/unpin (favourites), rename it through a small dialog, or delete it after
 * a confirmation.
 */
export function ConversationListItem({
  id,
  title,
  isActive,
  isPinned,
  onSelect,
  onTogglePin,
  onRename,
  onDelete,
}: Readonly<ConversationListItemProps>) {
  const { t } = useTranslation('translation');
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(title);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const submitRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onRename(trimmed);
      setRenameOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const submitDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete();
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div data-slot="conversation-list-item" className="group/conv flex items-center gap-1">
      <button
        type="button"
        onClick={onSelect}
        className={`hover:bg-accent min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm ${
          isActive ? 'bg-accent font-medium' : ''
        }`}
      >
        {title}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('AiChat.Conversation.Actions')}
            className={`text-muted-foreground size-7 shrink-0 transition-opacity focus-visible:opacity-100 data-[state=open]:opacity-100 ${
              isActive ? 'opacity-100' : 'opacity-0 group-hover/conv:opacity-100'
            }`}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onTogglePin}>
            {isPinned ? (
              <PinOff className="size-4" aria-hidden />
            ) : (
              <Pin className="size-4" aria-hidden />
            )}
            {isPinned ? t('AiChat.Conversation.Unpin') : t('AiChat.Conversation.Pin')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setName(title);
              setRenameOpen(true);
            }}
          >
            <Pencil className="size-4" aria-hidden />
            {t('AiChat.Conversation.Rename')}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" aria-hidden />
            {t('AiChat.Conversation.Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent data-slot="rename-conversation-dialog">
          <DialogHeader>
            <DialogTitle>{t('AiChat.Conversation.RenameTitle')}</DialogTitle>
            <DialogDescription>{t('AiChat.Conversation.RenameDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`rename-${id}`}>{t('AiChat.Conversation.RenameLabel')}</Label>
            <Input
              id={`rename-${id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void submitRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              {t('Common.Cancel')}
            </Button>
            <Button
              type="button"
              onClick={submitRename}
              disabled={name.trim().length === 0 || saving}
            >
              {t('Common.Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        data-slot="delete-conversation-dialog"
        tone="destructive"
        title={t('AiChat.Conversation.DeleteTitle')}
        description={t('AiChat.Conversation.DeleteDescription', { title })}
        confirmLabel={t('Common.Delete')}
        isPending={deleting}
        onConfirm={() => {
          void submitDelete();
        }}
      />
    </div>
  );
}
