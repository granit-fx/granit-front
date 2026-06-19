import { SEND_MESSAGE_LIMITS } from '@granit/ai-chat';
import { createLogger } from '@granit/logger';
import { cn } from '@granit/utils';
import { ArrowUp, Paperclip, Sparkles, Square } from 'lucide-react';
import { useCallback, useId, useMemo, useRef, useState } from 'react';

import { defaultChatLabels } from '../locales/index';

import { AttachmentChips } from './attachment-chips';
import { ComposerSuggestions } from './composer-suggestions';
import { detectTrigger } from './detect-trigger';
import { WorkspaceSelector } from './workspace-selector';

import type { ComposerAttachment } from './attachment-chips';
import type {
  MentionOption,
  PromptOption,
  SearchMentions,
  StagedMention,
  UploadAttachment,
  WorkspaceOption,
} from './composer-types';
import type { ActiveTrigger } from './detect-trigger';
import type { ChatTranslations } from '../locales/index';
import type { SendMessageRequest } from '@granit/ai-chat';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';

const logger = createLogger('react-ai-chat');

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
 * The streaming chat composer: a textarea with `/` prompt and `@` mention
 * autocomplete, attachment chips, an optional workspace selector, and a
 * Send/Stop button. App-specific concerns (mention search, blob upload) are
 * injected as adapters; everything else is headless and framework-agnostic.
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
  const [text, setText] = useState('');
  const [promptBadges, setPromptBadges] = useState<readonly PromptOption[]>([]);
  const [mentions, setMentions] = useState<readonly StagedMention[]>([]);
  const [attachments, setAttachments] = useState<readonly ComposerAttachment[]>([]);
  const [trigger, setTrigger] = useState<ActiveTrigger | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionResults, setMentionResults] = useState<readonly MentionOption[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.target.value;
      setText(next);
      const caret = event.target.selectionStart ?? next.length;
      const active = detectTrigger(next, caret);
      setTrigger(active);
      setActiveIndex(0);
      if (active?.kind === '@') runMentionSearch(active.query);
      else setMentionResults([]);
    },
    [runMentionSearch]
  );

  const replaceTriggerToken = useCallback(
    (replacement: string) => {
      if (!trigger) return;
      const caret = textareaRef.current?.selectionStart ?? text.length;
      setText((current) => current.slice(0, trigger.start) + replacement + current.slice(caret));
      setTrigger(null);
      setMentionResults([]);
    },
    [trigger, text.length]
  );

  const selectPrompt = useCallback(
    (option: PromptOption) => {
      setPromptBadges((current) => {
        if (current.some((p) => p.id === option.id)) return current;
        if (current.length >= SEND_MESSAGE_LIMITS.PROMPT_REFS_MAX) return current;
        return [...current, option];
      });
      replaceTriggerToken('');
      textareaRef.current?.focus();
    },
    [replaceTriggerToken]
  );

  const selectMention = useCallback(
    (option: MentionOption) => {
      setMentions((current) => {
        if (current.length >= SEND_MESSAGE_LIMITS.MENTIONS_MAX) return current;
        return [...current, { type: option.type, id: option.id, label: option.label }];
      });
      replaceTriggerToken(`@${option.label} `);
      textareaRef.current?.focus();
    },
    [replaceTriggerToken]
  );

  const selectActive = useCallback(() => {
    const item = suggestionItems[activeIndex];
    if (!item) return;
    if (trigger?.kind === '/') selectPrompt(item as PromptOption);
    else selectMention(item as MentionOption);
  }, [suggestionItems, activeIndex, trigger, selectPrompt, selectMention]);

  const hasUploading = attachments.some((a) => a.status === 'uploading');
  const canSend = text.trim().length > 0 && !hasUploading && !disabled;

  // Rich options win; otherwise derive plain options from the workspace names.
  const resolvedWorkspaceOptions = useMemo<readonly WorkspaceOption[]>(() => {
    if (workspaceOptions && workspaceOptions.length > 0) return workspaceOptions;
    return (workspaces ?? []).map((ws) => ({ value: ws }));
  }, [workspaceOptions, workspaces]);

  const submit = useCallback(() => {
    if (!canSend) return;
    const request: SendMessageRequest = {
      message: text.trim(),
      ...(workspace ? { workspaceName: workspace } : {}),
      ...(promptBadges.length > 0 ? { promptRefs: promptBadges.map((p) => p.id) } : {}),
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
    setText('');
    setPromptBadges([]);
    setMentions([]);
    setAttachments([]);
    setTrigger(null);
  }, [canSend, text, workspace, promptBadges, mentions, attachments, onSubmit]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
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

  const removePromptBadge = useCallback((id: string) => {
    setPromptBadges((current) => current.filter((p) => p.id !== id));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((a) => a.id !== id));
  }, []);

  return (
    <div data-slot="chat-composer" className={cn('flex flex-col gap-2', className)}>
      {promptBadges.length > 0 ? (
        <ul data-slot="prompt-badges" className="flex flex-wrap gap-2">
          {promptBadges.map((badge) => (
            <li
              key={badge.id}
              data-slot="prompt-badge"
              className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              <span>/{badge.name}</span>
              <button
                type="button"
                aria-label={`${labels.RemovePrompt} ${badge.name}`}
                onClick={() => {
                  removePromptBadge(badge.id);
                }}
                className="hover:text-primary/70"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <AttachmentChips attachments={attachments} labels={labels} onRemove={removeAttachment} />

      <div
        data-slot="composer-card"
        className={cn(
          'border-border bg-background relative flex flex-col gap-2 rounded-2xl border px-3 py-2 shadow-sm transition-colors',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]'
        )}
      >
        {showSuggestions && trigger?.kind === '/' ? (
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
        ) : null}

        {showSuggestions && trigger?.kind === '@' ? (
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
        ) : null}

        <textarea
          ref={textareaRef}
          data-slot="composer-input"
          value={text}
          disabled={disabled}
          rows={2}
          maxLength={SEND_MESSAGE_LIMITS.MESSAGE_MAX_LENGTH}
          placeholder={labels.Placeholder}
          aria-label={labels.Placeholder}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? listboxId : undefined}
          aria-activedescendant={
            showSuggestions && suggestionItems.length > 0 ? getOptionId(activeIndex) : undefined
          }
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="placeholder:text-muted-foreground w-full resize-none bg-transparent px-1 text-sm outline-none disabled:opacity-50"
        />

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
