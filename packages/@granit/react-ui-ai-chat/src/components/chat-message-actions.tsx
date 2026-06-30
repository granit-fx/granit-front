import { MESSAGE_REPORT_CATEGORIES, REPORT_REASON_MAX_LENGTH } from '@granit/ai-chat';
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from '@granit/react-ui';
import { ChevronDown, Code2, Copy, Flag, Hash, RefreshCw, RemoveFormatting } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

import { copyMessage } from './chat-clipboard';

const log = logger.child('ChatMessageActions');

import type { CopyFormat } from './chat-clipboard';
import type { MessageReportCategory } from '@granit/ai-chat';
import type { LucideIcon } from 'lucide-react';

/** Ghost icon button with a tooltip — relies on the app's root TooltipProvider. */
function ActionButton({
  icon: Icon,
  label,
  onClick,
}: Readonly<{ icon: LucideIcon; label: string; onClick: () => void }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onClick}
          aria-label={label}
        >
          <Icon className="size-3.5" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** One Markdown copy flavour: icon, title, and a hint about its ideal target. */
const COPY_FORMATS: ReadonlyArray<{
  format: CopyFormat;
  icon: LucideIcon;
  titleKey: string;
  hintKey: string;
}> = [
  {
    format: 'html',
    icon: Code2,
    titleKey: 'AiChat.Actions.CopyAsHtml',
    hintKey: 'AiChat.Actions.CopyAsHtmlHint',
  },
  {
    format: 'markdown',
    icon: Hash,
    titleKey: 'AiChat.Actions.CopyAsMarkdown',
    hintKey: 'AiChat.Actions.CopyAsMarkdownHint',
  },
  {
    format: 'plain',
    icon: RemoveFormatting,
    titleKey: 'AiChat.Actions.CopyAsPlain',
    hintKey: 'AiChat.Actions.CopyAsPlainHint',
  },
];

/** Split "Copy" control: a ghost icon trigger that opens the three flavours. */
function CopyMenu({
  onCopy,
  label,
  t,
}: Readonly<{
  onCopy: (format: CopyFormat) => void;
  label: string;
  t: (key: string) => string;
}>) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={label}>
              <Copy className="size-3.5" aria-hidden />
              <ChevronDown className="size-2.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-64">
        {COPY_FORMATS.map(({ format, icon: Icon, titleKey, hintKey }) => (
          <DropdownMenuItem
            key={format}
            onSelect={() => onCopy(format)}
            className="items-start gap-2"
          >
            <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="flex flex-col">
              <span className="font-medium">{t(titleKey)}</span>
              <span className="text-muted-foreground text-xs">{t(hintKey)}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface ChatMessageActionsProps {
  /** Message text to copy to the clipboard. */
  readonly content: string;
  /**
   * Whether the content is assistant Markdown. When `true`, "Copy" becomes a
   * split menu offering HTML / Markdown / plain-text flavours; otherwise it stays
   * a single plain-text copy button (user messages are verbatim text).
   */
  readonly isAssistant?: boolean;
  /** Show the "regenerate" action (assistant messages, not while streaming). */
  readonly canRegenerate?: boolean;
  /** Re-run the turn that produced this message. */
  readonly onRegenerate?: () => void;
  /** Show the "report" action (assistant messages). */
  readonly canReport?: boolean;
  /**
   * Submit a report for this message. Resolves on success (the dialog confirms
   * and closes) or rejects to surface an error. The wire carries only the
   * reason + optional category — never the message content (ADR-071).
   */
  readonly onReport?: (reason: string, category?: MessageReportCategory) => Promise<void>;
}

/**
 * Per-message action row injected into {@link ConversationThread} via its
 * `renderMessageActions` slot: copy the text, regenerate the answer, or report
 * the response. "Report" opens a dialog that collects a category + free-text
 * reason and delegates the submission to {@link ChatMessageActionsProps.onReport}.
 */
export function ChatMessageActions({
  content,
  isAssistant = false,
  canRegenerate = false,
  onRegenerate,
  canReport = false,
  onReport,
}: Readonly<ChatMessageActionsProps>) {
  const { t } = useTranslation('translation');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<MessageReportCategory | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const handleCopy = async (format: CopyFormat) => {
    try {
      await copyMessage(content, format);
      toast.success(t('AiChat.Actions.Copied'));
    } catch (error) {
      log.error('Failed to copy chat message to clipboard', error);
      toast.error(t('AiChat.Actions.CopyFailed'));
    }
  };

  const resetReport = () => {
    setReason('');
    setCategory('');
  };

  const submitReport = async () => {
    const trimmed = reason.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onReport?.(trimmed, category || undefined);
      toast.success(t('AiChat.Actions.ReportSubmitted'));
      resetReport();
      setReportOpen(false);
    } catch (error) {
      log.error('Failed to report chat message', error);
      toast.error(t('AiChat.Actions.ReportFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-slot="chat-message-actions-buttons" className="flex items-center gap-0.5">
      {isAssistant ? (
        <CopyMenu onCopy={handleCopy} label={t('AiChat.Actions.Copy')} t={t} />
      ) : (
        <ActionButton
          icon={Copy}
          label={t('AiChat.Actions.Copy')}
          onClick={() => handleCopy('plain')}
        />
      )}

      {canRegenerate && onRegenerate ? (
        <ActionButton
          icon={RefreshCw}
          label={t('AiChat.Actions.Regenerate')}
          onClick={onRegenerate}
        />
      ) : null}

      {canReport ? (
        <ActionButton
          icon={Flag}
          label={t('AiChat.Actions.Report')}
          onClick={() => setReportOpen(true)}
        />
      ) : null}

      <Dialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) resetReport();
        }}
      >
        <DialogContent data-slot="chat-report-dialog">
          <DialogHeader>
            <DialogTitle>{t('AiChat.Actions.ReportDialogTitle')}</DialogTitle>
            <DialogDescription>{t('AiChat.Actions.ReportDialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-report-category">
                {t('AiChat.Actions.ReportCategoryLabel')}
              </Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as MessageReportCategory)}
              >
                <SelectTrigger id="chat-report-category">
                  <SelectValue placeholder={t('AiChat.Actions.ReportCategoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MESSAGE_REPORT_CATEGORIES).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`AiChat.Actions.Category.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat-report-reason">{t('AiChat.Actions.ReportReasonLabel')}</Label>
              <Textarea
                id="chat-report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t('AiChat.Actions.ReportReasonPlaceholder')}
                maxLength={REPORT_REASON_MAX_LENGTH}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
              {t('Common.Cancel')}
            </Button>
            <Button
              type="button"
              onClick={submitReport}
              disabled={reason.trim().length === 0 || submitting}
            >
              {t('AiChat.Actions.ReportSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
