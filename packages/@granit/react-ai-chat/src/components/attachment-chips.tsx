import { cn, formatBytes } from '@granit/utils';
import { File as FileIcon, Loader2, X } from 'lucide-react';

import { defaultChatLabels } from '../locales/index';

import type { ChatTranslations } from '../locales/index';
import type { AttachmentRequest } from '@granit/ai-chat';

/** Upload lifecycle of a composer attachment. */
export type AttachmentStatus = 'uploading' | 'ready' | 'error';

/** A composer attachment: the request payload plus its upload status. */
export interface ComposerAttachment extends AttachmentRequest {
  /** Stable client id (the upload may not have a `reference` yet). */
  readonly id: string;
  readonly status: AttachmentStatus;
}

export interface AttachmentChipsProps {
  readonly attachments: readonly ComposerAttachment[];
  readonly onRemove: (id: string) => void;
  readonly labels?: ChatTranslations['Composer'];
  readonly className?: string;
}

/** Renders the staged attachments as removable chips with upload status. */
export function AttachmentChips({
  attachments,
  onRemove,
  labels = defaultChatLabels.Composer,
  className,
}: Readonly<AttachmentChipsProps>) {
  if (attachments.length === 0) return null;

  return (
    <ul data-slot="attachment-chips" className={cn('flex flex-wrap gap-2', className)}>
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          data-slot="attachment-chip"
          data-status={attachment.status}
          className="border-border bg-muted flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
        >
          {attachment.status === 'uploading' ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <FileIcon className="size-3.5" aria-hidden />
          )}
          <span className="max-w-40 truncate">{attachment.fileName}</span>
          <span className="text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span>
          <button
            type="button"
            aria-label={`${labels.RemoveAttachment} ${attachment.fileName}`}
            onClick={() => {
              onRemove(attachment.id);
            }}
            className="hover:text-foreground text-muted-foreground"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
