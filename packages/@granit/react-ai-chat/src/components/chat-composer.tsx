import { SEND_MESSAGE_LIMITS } from '@granit/ai-chat';
import { cn } from '@granit/utils';
import { Paperclip, Send, Square } from 'lucide-react';
import { useCallback, useId, useMemo, useRef, useState } from 'react';

import { defaultChatLabels } from '../locales/index';

import { AttachmentChips } from './attachment-chips';
import { ComposerSuggestions } from './composer-suggestions';
import { detectTrigger } from './detect-trigger';

import type { ComposerAttachment } from './attachment-chips';
import type {
  MentionOption,
  PromptOption,
  SearchMentions,
  StagedMention,
  UploadAttachment,
} from './composer-types';
import type { ActiveTrigger } from './detect-trigger';
import type { ChatTranslations } from '../locales/index';
import type { SendMessageRequest } from '@granit/ai-chat';
import type { ChangeEvent, KeyboardEvent } from 'react';

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
  /** Selectable workspaces (`Auto` first); omit to hide the selector. */
  readonly workspaces?: readonly string[];
  readonly workspace?: string;
  readonly onWorkspaceChange?: (workspace: string) => void;
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
  workspaces,
  workspace,
  onWorkspaceChange,
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
        .catch(() => {
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
          .then((uploaded) => {
            setAttachments((current) =>
              current.map((a) => (a.id === id ? { ...a, ...uploaded, status: 'ready' } : a))
            );
          })
          .catch(() => {
            setAttachments((current) =>
              current.map((a) => (a.id === id ? { ...a, status: 'error' } : a))
            );
          });
      }
    },
    [uploadAttachment]
  );

  return (
    <div data-slot="chat-composer" className={cn('flex flex-col gap-2', className)}>
      {promptBadges.length > 0 ? (
        <ul data-slot="prompt-badges" className="flex flex-wrap gap-2">
          {promptBadges.map((badge) => (
            <li
              key={badge.id}
              data-slot="prompt-badge"
              className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
            >
              <span>/{badge.name}</span>
              <button
                type="button"
                aria-label={`${labels.RemovePrompt} ${badge.name}`}
                onClick={() => {
                  setPromptBadges((current) => current.filter((p) => p.id !== badge.id));
                }}
                className="hover:text-primary/70"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <AttachmentChips
        attachments={attachments}
        labels={labels}
        onRemove={(id) => {
          setAttachments((current) => current.filter((a) => a.id !== id));
        }}
      />

      <div className="relative">
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
          className="border-input bg-background w-full resize-none rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {workspaces && workspaces.length > 0 ? (
            <select
              data-slot="composer-workspace"
              aria-label={labels.Workspace}
              value={workspace ?? workspaces[0]}
              disabled={disabled}
              onChange={(event) => onWorkspaceChange?.(event.target.value)}
              className="border-input bg-background rounded-md border px-2 py-1 text-xs"
            >
              {workspaces.map((ws) => (
                <option key={ws} value={ws}>
                  {ws}
                </option>
              ))}
            </select>
          ) : null}

          {uploadAttachment ? (
            <label
              data-slot="composer-attach"
              className="hover:bg-accent inline-flex cursor-pointer items-center rounded-md p-1.5"
              title={labels.Attach}
            >
              <Paperclip className="size-4" aria-hidden />
              <span className="sr-only">{labels.Attach}</span>
              <input
                type="file"
                multiple
                className="hidden"
                disabled={disabled}
                onChange={handleFiles}
              />
            </label>
          ) : null}
        </div>

        {isStreaming ? (
          <button
            type="button"
            data-slot="composer-stop"
            onClick={onStop}
            className="bg-muted text-foreground inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm"
          >
            <Square className="size-3.5" aria-hidden />
            {labels.Stop}
          </button>
        ) : (
          <button
            type="button"
            data-slot="composer-send"
            disabled={!canSend}
            onClick={submit}
            className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <Send className="size-3.5" aria-hidden />
            {labels.Send}
          </button>
        )}
      </div>
    </div>
  );
}
