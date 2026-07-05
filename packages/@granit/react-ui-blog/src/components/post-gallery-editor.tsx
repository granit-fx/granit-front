import {
  useAddPostAttachment,
  useRemovePostAttachment,
  useReorderPostAttachments,
  useUpdatePostAttachment,
} from '@granit/react-blog';
import { useTranslation } from '@granit/react-localization';
import { toast, Button, Input, Label } from '@granit/react-ui';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DocumentPickerButton } from './document-picker-button';

import type { BlogPostAttachmentResponse, BlogPostResponse } from '@granit/blog';

export interface PostGalleryEditorProps {
  readonly post: BlogPostResponse;
}

/**
 * Media gallery: add, describe (caption / alt text), remove and reorder
 * attachments. Reorder posts the full ordered set of document ids
 * (`PUT /posts/{id}/attachments/order`; the backend rejects a partial set).
 */
export function PostGalleryEditor({ post }: PostGalleryEditorProps) {
  const { t } = useTranslation();
  const addAttachment = useAddPostAttachment();
  const updateAttachment = useUpdatePostAttachment();
  const removeAttachment = useRemovePostAttachment();
  const reorder = useReorderPostAttachments();

  const ordered = [...post.attachments].sort((a, b) => a.sortOrder - b.sortOrder);

  function move(index: number, delta: number) {
    const next = [...ordered];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    reorder.mutate({
      id: post.id,
      request: { documentIdsInOrder: next.map((att) => att.documentId) },
    });
  }

  function handleAdd(documentId: string | null) {
    if (!documentId) return;
    addAttachment.mutate({ id: post.id, request: { documentId } });
  }

  return (
    <div data-slot="post-gallery-editor" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-medium">{t('blog:Gallery.Title', 'Gallery')}</h3>
        <DocumentPickerButton
          value={null}
          onChange={handleAdd}
          pickLabel={t('blog:Gallery.Add', 'Add attachment…')}
          clearLabel={t('blog:Common.Remove', 'Remove')}
        />
      </div>

      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('blog:Gallery.Empty', 'No attachments yet.')}
        </p>
      ) : (
        <ul className="space-y-3">
          {ordered.map((attachment, index) => (
            <AttachmentRow
              key={attachment.documentId}
              postId={post.id}
              attachment={attachment}
              index={index}
              total={ordered.length}
              onMove={move}
              onRemove={() =>
                removeAttachment.mutate(
                  { id: post.id, documentId: attachment.documentId },
                  {
                    onSuccess: () =>
                      toast.success(t('blog:Gallery.RemoveSuccess', 'Attachment removed.')),
                  }
                )
              }
              onSave={(caption, altText) =>
                updateAttachment.mutate(
                  { id: post.id, documentId: attachment.documentId, request: { caption, altText } },
                  {
                    onSuccess: () =>
                      toast.success(t('blog:Gallery.SaveSuccess', 'Attachment updated.')),
                  }
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AttachmentRow({
  attachment,
  index,
  total,
  onMove,
  onRemove,
  onSave,
}: {
  readonly postId: string;
  readonly attachment: BlogPostAttachmentResponse;
  readonly index: number;
  readonly total: number;
  readonly onMove: (index: number, delta: number) => void;
  readonly onRemove: () => void;
  readonly onSave: (caption: string | null, altText: string | null) => void;
}) {
  const { t } = useTranslation();
  const [caption, setCaption] = useState(attachment.caption ?? '');
  const [altText, setAltText] = useState(attachment.altText ?? '');

  return (
    <li className="flex flex-wrap items-end gap-3 rounded-md border p-3" data-slot="attachment-row">
      <span className="font-mono text-xs text-muted-foreground">{attachment.documentId}</span>
      <div className="space-y-1">
        <Label htmlFor={`caption-${attachment.documentId}`}>
          {t('blog:Gallery.Caption', 'Caption')}
        </Label>
        <Input
          id={`caption-${attachment.documentId}`}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`alt-${attachment.documentId}`}>
          {t('blog:Gallery.AltText', 'Alt text')}
        </Label>
        <Input
          id={`alt-${attachment.documentId}`}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index === 0}
          aria-label={t('blog:Gallery.MoveUp', 'Move up')}
          onClick={() => onMove(index, -1)}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index === total - 1}
          aria-label={t('blog:Gallery.MoveDown', 'Move down')}
          onClick={() => onMove(index, 1)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSave(caption || null, altText || null)}
        >
          {t('blog:Common.Save', 'Save')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('blog:Common.Remove', 'Remove')}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </li>
  );
}
