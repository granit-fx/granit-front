import { SEND_MESSAGE_LIMITS } from '@granit/ai-chat';
import { createLogger } from '@granit/logger';
import { cn } from '@granit/utils';
import { ArrowUp, Paperclip, Sparkles, Square } from 'lucide-react';
import { useCallback, useId, useMemo, useRef, useState } from 'react';

import { defaultChatLabels } from '../locales/index';

import { AttachmentChips } from './attachment-chips';
import { CHIP_SLOT, createChipElement, isEditorEmpty, serializeEditor } from './composer-content';
import { ComposerSuggestions } from './composer-suggestions';
import { detectTrigger } from './detect-trigger';
import { WorkspaceSelector } from './workspace-selector';

import type { ComposerAttachment } from './attachment-chips';
import type { ChipSpec } from './composer-content';
import type {
  MentionOption,
  PromptOption,
  SearchMentions,
  UploadAttachment,
  WorkspaceOption,
} from './composer-types';
import type { ActiveTrigger } from './detect-trigger';
import type { ChatTranslations } from '../locales/index';
import type { SendMessageRequest } from '@granit/ai-chat';
import type {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from 'react';

const logger = createLogger('react-ai-chat');

/** Caret-moving keys that should re-evaluate the `/` `@` trigger on key-up. */
const CARET_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

export interface ChatComposerProps {
  /** Builds and submits a {@link SendMessageRequest} for the turn. */
  readonly onSubmit: (request: SendMessageRequest) => void;
  /** Whether a turn is streaming — flips Send into a Stop button. */
  readonly isStreaming?: boolean;
  /** Abort the in-flight turn. */
  readonly onStop?: () => void;
  /** Prompt options for the `/` picker (filtered client-side by the query). */
  readonly prompts?: readonly PromptOption[];
  /** App-specific `@` mention search. Omit to disable the mention picker. */
  readonly searchMentions?: SearchMentions;
  /** App-specific attachment upload. Omit to hide the attach button. */
  readonly uploadAttachment?: UploadAttachment;
  /** Comma-separated MIME types for the file picker `accept` attribute (e.g. from `CHAT_ATTACHMENT_ACCEPT`). */
  readonly attachAccept?: string;
  /** Selectable workspaces (`Auto` first); omit to hide the selector. */
  readonly workspaces?: readonly string[];
  /**
   * Rich workspace/model options (leading mark, capability glyphs, provider
   * grouping). When supplied, drives the picker instead of {@link workspaces};
   * brand-agnostic — the host owns every glyph.
   */
  readonly workspaceOptions?: readonly WorkspaceOption[];
  readonly workspace?: string;
  readonly onWorkspaceChange?: (workspace: string) => void;
  /**
   * Optional leading glyph for the workspace chip when the selected option has
   * no `icon` of its own. Defaults to a generic `Sparkles` icon — the framework
   * stays brand-agnostic; apps may inject their own model/provider mark here.
   */
  readonly workspaceIcon?: ReactNode;
  readonly labels?: ChatTranslations['Composer'];
  readonly pickerLabels?: ChatTranslations['Pickers'];
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * The streaming chat composer: a `contenteditable` rich input where `/` prompts
 * and `@` mentions resolve to inline chips in the text flow, plus attachment
 * chips, an optional workspace selector, and a Send/Stop button. Selected chips
 * contribute their label to the message and populate the request's structured
 * `promptRefs`/`mentions`. App-specific concerns (mention search, blob upload)
 * are injected as adapters; everything else is headless and framework-agnostic.
 */
export function ChatComposer({
  onSubmit,
  isStreaming = false,
  onStop,
  prompts = [],
  searchMentions,
  uploadAttachment,
  attachAccept,
  workspaces,
  workspaceOptions,
  workspace,
  onWorkspaceChange,
  workspaceIcon,
  labels = defaultChatLabels.Composer,
  pickerLabels = defaultChatLabels.Pickers,
  disabled = false,
  className,
}: Readonly<ChatComposerProps>) {
  // The editor DOM is the single source of truth for the message + its chips;
  // `isEmpty` is the only mirrored bit, driving the placeholder and Send state.
  const [isEmpty, setIsEmpty] = useState(true);
  const [attachments, setAttachments] = useState<readonly ComposerAttachment[]>([]);
  const [trigger, setTrigger] = useState<ActiveTrigger | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionResults, setMentionResults] = useState<readonly MentionOption[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  // The trigger token's location, captured so a picked chip can replace it even
  // after the picker click moved focus out of the editor.
  const triggerLocRef = useRef<{ node: Text; start: number; end: number } | null>(null);
  const searchSeq = useRef(0);
  const attachmentSeq = useRef(0);

  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const getOptionId = useCallback((index: number) => `${baseId}-opt-${index}`, [baseId]);

  const promptMatches = useMemo<readonly PromptOption[]>(() => {
    if (trigger?.kind !== '/') return [];
    const q = trigger.query.toLowerCase();
    return prompts.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [trigger, prompts]);

  const suggestionItems = trigger?.kind === '@' ? mentionResults : promptMatches;
  const showSuggestions =
    trigger !== null && (trigger.kind === '/' || searchMentions !== undefined);

  const runMentionSearch = useCallback(
    (query: string) => {
      if (!searchMentions) return;
      const seq = ++searchSeq.current;
      setMentionLoading(true);
      searchMentions(query)
        .then((results) => {
          if (seq === searchSeq.current) {
            setMentionResults(results);
            setMentionLoading(false);
          }
        })
        .catch((err: unknown) => {
          logger.warn('Mention search failed; cleared results', { err });
          if (seq === searchSeq.current) {
            setMentionResults([]);
            setMentionLoading(false);
          }
        });
    },
    [searchMentions]
  );

  /**
   * Re-evaluate the `/` `@` trigger from the live caret. A trigger is only valid
   * inside a single text node (chips are node boundaries), so we run the shared
   * {@link detectTrigger} against the caret's text node and remember the token's
   * span for {@link insertChip}.
   */
  const refreshTrigger = useCallback(() => {
    const editor = editorRef.current;
    const selection = typeof window !== 'undefined' ? window.getSelection() : null;
    const node = selection?.anchorNode ?? null;
    if (!editor || !selection || !selection.isCollapsed || !node || node.nodeType !== 3) {
      triggerLocRef.current = null;
      setTrigger(null);
      return;
    }
    if (!editor.contains(node)) {
      triggerLocRef.current = null;
      setTrigger(null);
      return;
    }
    const caret = selection.anchorOffset;
    const active = detectTrigger(node.textContent ?? '', caret);
    if (!active) {
      triggerLocRef.current = null;
      setTrigger(null);
      setMentionResults([]);
      return;
    }
    triggerLocRef.current = { node: node as Text, start: active.start, end: caret };
    setTrigger(active);
    setActiveIndex(0);
    if (active.kind === '@') runMentionSearch(active.query);
    else setMentionResults([]);
  }, [runMentionSearch]);

  const handleInput = useCallback(
    (event: FormEvent<HTMLDivElement>) => {
      setIsEmpty(isEditorEmpty(event.currentTarget));
      refreshTrigger();
    },
    [refreshTrigger]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (CARET_KEYS.has(event.key)) refreshTrigger();
    },
    [refreshTrigger]
  );

  const handleMouseUp = useCallback(() => refreshTrigger(), [refreshTrigger]);

  /** Count the chips of a kind already placed, to honour the per-turn limits. */
  const chipCount = useCallback((kind: ChipSpec['kind']) => {
    return (
      editorRef.current?.querySelectorAll(`[data-slot="${CHIP_SLOT}"][data-kind="${kind}"]`)
        .length ?? 0
    );
  }, []);

  /** Replace the active trigger token with a chip + trailing space; re-focus. */
  const insertChip = useCallback((spec: ChipSpec, iconColor?: string | null) => {
    const editor = editorRef.current;
    const loc = triggerLocRef.current;
    if (!editor || !loc) return;
    const doc = editor.ownerDocument;
    const length = loc.node.textContent?.length ?? 0;
    const range = doc.createRange();
    range.setStart(loc.node, Math.min(loc.start, length));
    range.setEnd(loc.node, Math.min(loc.end, length));
    range.deleteContents();

    const chip = createChipElement(doc, spec, iconColor);
    range.insertNode(chip);
    // A non-breaking space keeps the caret off the non-editable chip and gives a
    // visible gap; serialization collapses it back to a normal space.
    const spacer = doc.createTextNode(' ');
    chip.after(spacer);

    editor.focus();
    const after = doc.createRange();
    after.setStartAfter(spacer);
    after.collapse(true);
    const selection = doc.defaultView?.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(after);

    triggerLocRef.current = null;
    setTrigger(null);
    setMentionResults([]);
    setIsEmpty(isEditorEmpty(editor));
  }, []);

  const selectPrompt = useCallback(
    (option: PromptOption) => {
      if (chipCount('prompt') >= SEND_MESSAGE_LIMITS.PROMPT_REFS_MAX) {
        setTrigger(null);
        return;
      }
      insertChip({ kind: 'prompt', id: option.id, label: option.name }, option.iconColor);
    },
    [chipCount, insertChip]
  );

  const selectMention = useCallback(
    (option: MentionOption) => {
      if (chipCount('mention') >= SEND_MESSAGE_LIMITS.MENTIONS_MAX) {
        setTrigger(null);
        return;
      }
      insertChip({ kind: 'mention', id: option.id, type: option.type, label: option.label });
    },
    [chipCount, insertChip]
  );

  const selectActive = useCallback(() => {
    const item = suggestionItems[activeIndex];
    if (!item) return;
    if (trigger?.kind === '/') selectPrompt(item as PromptOption);
    else selectMention(item as MentionOption);
  }, [suggestionItems, activeIndex, trigger, selectPrompt, selectMention]);

  const hasUploading = attachments.some((a) => a.status === 'uploading');
  const canSend = !isEmpty && !hasUploading && !disabled;

  // Rich options win; otherwise derive plain options from the workspace names.
  const resolvedWorkspaceOptions = useMemo<readonly WorkspaceOption[]>(() => {
    if (workspaceOptions && workspaceOptions.length > 0) return workspaceOptions;
    return (workspaces ?? []).map((ws) => ({ value: ws }));
  }, [workspaceOptions, workspaces]);

  const submit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || hasUploading || disabled) return;
    const { message, mentions, promptRefs } = serializeEditor(editor);
    if (message.length === 0) return;

    const request: SendMessageRequest = {
      message,
      ...(workspace ? { workspaceName: workspace } : {}),
      ...(promptRefs.length > 0 ? { promptRefs: [...promptRefs] } : {}),
      ...(mentions.length > 0 ? { mentions: mentions.map(({ type, id }) => ({ type, id })) } : {}),
      ...(attachments.length > 0
        ? {
            attachments: attachments
              .filter((a) => a.status === 'ready')
              .map(({ reference, fileName, contentType, sizeBytes }) => ({
                reference,
                fileName,
                contentType,
                sizeBytes,
              })),
          }
        : {}),
    };
    onSubmit(request);
    editor.replaceChildren();
    setIsEmpty(true);
    setAttachments([]);
    setTrigger(null);
    setMentionResults([]);
  }, [hasUploading, disabled, workspace, attachments, onSubmit]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (showSuggestions && suggestionItems.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActiveIndex((i) => (i + 1) % suggestionItems.length);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActiveIndex((i) => (i - 1 + suggestionItems.length) % suggestionItems.length);
          return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          selectActive();
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setTrigger(null);
          return;
        }
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    },
    [showSuggestions, suggestionItems.length, selectActive, submit]
  );

  /** Keep the message within the wire limit by blocking inserts past it. */
  const handleBeforeInput = useCallback((event: FormEvent<HTMLDivElement>) => {
    const inputType = (event.nativeEvent as InputEvent).inputType ?? '';
    if (!inputType.startsWith('insert') || inputType === 'insertParagraph') return;
    const length = event.currentTarget.textContent?.length ?? 0;
    if (length >= SEND_MESSAGE_LIMITS.MESSAGE_MAX_LENGTH) event.preventDefault();
  }, []);

  /** Paste as plain text so foreign markup never enters the editor. */
  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const editor = editorRef.current;
      const pasted = event.clipboardData.getData('text/plain');
      if (!editor || !pasted) return;
      const remaining = SEND_MESSAGE_LIMITS.MESSAGE_MAX_LENGTH - (editor.textContent?.length ?? 0);
      const text = pasted.slice(0, Math.max(0, remaining));
      if (!text) return;
      const selection = editor.ownerDocument.defaultView?.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = editor.ownerDocument.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      setIsEmpty(isEditorEmpty(editor));
      refreshTrigger();
    },
    [refreshTrigger]
  );

  const patchAttachment = useCallback((id: string, patch: Partial<ComposerAttachment>) => {
    setAttachments((current) => current.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const handleFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';
      if (!uploadAttachment) return;
      for (const file of files) {
        const id = `att-${++attachmentSeq.current}`;
        setAttachments((current) => {
          if (current.length >= SEND_MESSAGE_LIMITS.ATTACHMENTS_MAX) return current;
          return [
            ...current,
            {
              id,
              status: 'uploading',
              reference: '',
              fileName: file.name,
              contentType: file.type,
              sizeBytes: file.size,
            },
          ];
        });
        uploadAttachment(file)
          .then((uploaded) => patchAttachment(id, { ...uploaded, status: 'ready' }))
          .catch((err: unknown) => {
            logger.warn('Composer attachment upload failed', {
              fileName: file.name,
              sizeBytes: file.size,
              err,
            });
            patchAttachment(id, { status: 'error' });
          });
      }
    },
    [uploadAttachment, patchAttachment]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((a) => a.id !== id));
  }, []);

  const onSuggestionMouseDown = useCallback((event: MouseEvent) => {
    // Keep the editor selection alive through the click so insertChip can replace
    // the trigger token (the chip's location is captured, but focus matters).
    event.preventDefault();
  }, []);

  return (
    <div data-slot="chat-composer" className={cn('flex flex-col gap-2', className)}>
      <AttachmentChips attachments={attachments} labels={labels} onRemove={removeAttachment} />

      <div
        data-slot="composer-card"
        className={cn(
          'border-border bg-background relative flex flex-col gap-2 rounded-2xl border px-3 py-2 shadow-sm transition-colors',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]'
        )}
      >
        {showSuggestions && trigger?.kind === '/' ? (
          <div onMouseDown={onSuggestionMouseDown}>
            <ComposerSuggestions<PromptOption>
              title={pickerLabels.Prompts}
              items={promptMatches}
              activeIndex={activeIndex}
              loadingLabel={pickerLabels.Loading}
              emptyLabel={pickerLabels.NoResults}
              listboxId={listboxId}
              getOptionId={getOptionId}
              getKey={(item) => item.id}
              onHover={setActiveIndex}
              onSelect={selectPrompt}
              renderItem={(item) => (
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  {item.shortDescription ? (
                    <span className="text-muted-foreground text-xs">{item.shortDescription}</span>
                  ) : null}
                </div>
              )}
            />
          </div>
        ) : null}

        {showSuggestions && trigger?.kind === '@' ? (
          <div onMouseDown={onSuggestionMouseDown}>
            <ComposerSuggestions<MentionOption>
              title={pickerLabels.Mentions}
              items={mentionResults}
              activeIndex={activeIndex}
              loading={mentionLoading}
              loadingLabel={pickerLabels.Loading}
              emptyLabel={pickerLabels.NoResults}
              listboxId={listboxId}
              getOptionId={getOptionId}
              getKey={(item) => `${item.type}:${item.id}`}
              onHover={setActiveIndex}
              onSelect={selectMention}
              renderItem={(item) => (
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  {item.description ? (
                    <span className="text-muted-foreground text-xs">{item.description}</span>
                  ) : null}
                </div>
              )}
            />
          </div>
        ) : null}

        <div className="relative">
          {isEmpty ? (
            <p
              data-slot="composer-placeholder"
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute inset-x-1 top-1 text-sm"
            >
              {labels.Placeholder}
            </p>
          ) : null}
          <div
            ref={editorRef}
            data-slot="composer-input"
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={labels.Placeholder}
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={showSuggestions ? listboxId : undefined}
            aria-activedescendant={
              showSuggestions && suggestionItems.length > 0 ? getOptionId(activeIndex) : undefined
            }
            onInput={handleInput}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onMouseUp={handleMouseUp}
            onPaste={handlePaste}
            className={cn(
              'min-h-[3rem] w-full px-1 py-1 text-sm break-words whitespace-pre-wrap outline-none',
              disabled && 'opacity-50'
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {uploadAttachment ? (
              <label
                data-slot="composer-attach"
                className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors"
                title={labels.Attach}
              >
                <Paperclip className="size-4" aria-hidden />
                <span className="sr-only">{labels.Attach}</span>
                <input
                  type="file"
                  multiple
                  accept={attachAccept}
                  className="hidden"
                  disabled={disabled}
                  onChange={handleFiles}
                />
              </label>
            ) : null}

            {resolvedWorkspaceOptions.length > 0 ? (
              <WorkspaceSelector
                options={resolvedWorkspaceOptions}
                value={workspace}
                onChange={(next) => onWorkspaceChange?.(next)}
                label={labels.Workspace}
                searchPlaceholder={labels.SearchWorkspaces}
                emptyLabel={pickerLabels.NoResults}
                fallbackIcon={workspaceIcon ?? <Sparkles className="size-3.5" aria-hidden />}
                disabled={disabled}
              />
            ) : null}
          </div>

          {isStreaming ? (
            <button
              type="button"
              data-slot="composer-stop"
              onClick={onStop}
              aria-label={labels.Stop}
              className="bg-primary text-primary-foreground inline-flex size-8 items-center justify-center rounded-full transition-colors"
            >
              <Square className="size-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              data-slot="composer-send"
              disabled={!canSend}
              onClick={submit}
              aria-label={labels.Send}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed',
                canSend ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
