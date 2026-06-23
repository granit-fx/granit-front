import { useAIWorkspaces } from '@granit/react-ai';
import {
  ChatComposer,
  ClarificationPrompt,
  ConversationThread,
  ScrollToBottomButton,
  SuggestedActions,
  useChatStream,
  useChatWorkspaces,
  useConversationMessages,
  useConversations,
  useDeleteConversation,
  useRenameConversation,
  useReportMessage,
  useReverseInfiniteScroll,
  useSetConversationFavorite,
  useStickToBottom,
} from '@granit/react-ai-chat';
import { CHAT_ATTACHMENT_ACCEPT, useAIChatBlobUpload } from '@granit/react-ai-chat-blob-storage';
import { usePromptPicker } from '@granit/react-ai-prompts';
import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ChatMessageActions } from './components/chat-message-actions';
import { ConversationListItem } from './components/conversation-list-item';
import { buildWorkspaceOptions } from './model-catalog';

import type {
  ConversationId,
  MessageResponse,
  SendMessageRequest,
  ConversationSummaryResponse,
} from '@granit/ai-chat';
import type { ChatTurnMetrics, PromptOption } from '@granit/react-ai-chat';

/** Strip leading blank lines/whitespace some models emit before the answer. */
const stripLeading = (text: string) => text.replace(/^\s+/, '');

/**
 * Per-conversation cache of the last turn's client-measured metrics. A brand-new
 * chat remounts its `ChatSurface` (keyed by id) the moment it is promoted to
 * `/ai/chat/:id`, which would otherwise drop the just-measured `stream.metrics`
 * before the timing chip can render. Stashing them by conversation id lets the
 * chip survive that remount. Session-scoped; cleared on a full reload.
 */
const lastTurnMetrics = new Map<ConversationId, ChatTurnMetrics>();

/**
 * Demo chat page: conversation list + streamed thread + the `/` `@` composer,
 * wiring the framework components to the BFF. Suggested actions become React
 * Router navigations; clarifications re-send the chosen answer.
 */
export function ChatPage() {
  const { t } = useTranslation('translation');
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const conversations = useConversations();
  const setFavorite = useSetConversationFavorite();
  const rename = useRenameConversation();
  const remove = useDeleteConversation();

  // The selected conversation is driven by the URL (`/ai/chat/:id`), so each
  // chat has a shareable, reload-safe link; `/ai/chat` is a fresh chat.
  const selectedId = (conversationId ?? null) as ConversationId | null;

  // Favourites are server-backed (`isFavorite`), so they persist across devices.
  const all = conversations.data ?? [];
  const favorites = all.filter((item) => item.isFavorite);
  const others = all.filter((item) => !item.isFavorite);
  const selectedConversation = selectedId ? (all.find((c) => c.id === selectedId) ?? null) : null;

  const renderItem = (item: ConversationSummaryResponse) => (
    <li key={item.id}>
      <ConversationListItem
        id={item.id}
        title={item.title}
        isActive={item.id === selectedId}
        isPinned={item.isFavorite}
        onSelect={() => navigate(`/ai/chat/${item.id}`)}
        onTogglePin={() =>
          setFavorite.setFavoriteAsync({ id: item.id, isFavorite: !item.isFavorite })
        }
        onRename={(title) => rename.renameAsync({ id: item.id, request: { title } })}
        onDelete={async () => {
          await remove.removeAsync(item.id);
          // Leaving the deleted chat open would 404 on reload, so fall back to
          // a fresh chat when the active conversation is the one removed.
          if (item.id === selectedId) navigate('/ai/chat');
        }}
      />
    </li>
  );

  return (
    <div data-slot="ai-chat-page" className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="flex w-64 shrink-0 flex-col gap-2 border-r pr-3">
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={() => navigate('/ai/chat')}
        >
          <MessageSquarePlus className="size-4" aria-hidden />
          {t('Navigation.AiChat', 'Chat')}
        </Button>
        <div className="scrollbar-overlay flex flex-col gap-3 overflow-auto">
          {favorites.length > 0 ? (
            <div>
              <p className="text-muted-foreground px-2 pb-1 text-xs font-medium">
                {t('AiChat.Conversation.Favorites')}
              </p>
              <ul className="flex flex-col gap-1">{favorites.map(renderItem)}</ul>
            </div>
          ) : null}
          <div>
            {favorites.length > 0 ? (
              <p className="text-muted-foreground px-2 pb-1 text-xs font-medium">
                {t('AiChat.Conversation.Recent')}
              </p>
            ) : null}
            <ul className="flex flex-col gap-1">{others.map(renderItem)}</ul>
          </div>
        </div>
      </aside>

      <ChatSurface
        key={selectedId ?? 'new'}
        selectedId={selectedId}
        initialWorkspaceKey={selectedConversation?.workspaceKey ?? null}
      />
    </div>
  );
}

interface ChatSurfaceProps {
  readonly selectedId: ConversationId | null;
  /** Workspace key frozen at conversation creation; null for new chats or pre-feature conversations. */
  readonly initialWorkspaceKey: string | null;
}

/** One chat session: stream + thread + composer. Remounted to start fresh. */
function ChatSurface({ selectedId, initialWorkspaceKey }: Readonly<ChatSurfaceProps>) {
  const { t } = useTranslation('translation');
  const navigate = useNavigate();
  const workspaces = useChatWorkspaces();
  const aiWorkspaces = useAIWorkspaces();
  const picker = usePromptPicker();
  const stream = useChatStream();
  const reportMessage = useReportMessage();

  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<string | undefined>(initialWorkspaceKey ?? undefined);
  const uploadAttachment = useAIChatBlobUpload('chat-attachments');
  // Tracks whether the workspace was already seeded from conversation metadata.
  // When false (new chat, or pre-feature conversation with null workspaceKey),
  // we sync from the first assistant message once it arrives.
  const [workspaceSeeded, setWorkspaceSeeded] = useState(initialWorkspaceKey != null);

  // The active conversation is the explicitly selected one, or the id the
  // stream announces for a brand-new chat.
  const activeId = selectedId ?? stream.conversationId ?? null;
  // Messages come from the reverse-infinite query (newest page first, older on
  // scroll-up); `use-chat-stream` appends each finished turn to its cache.
  const messageQuery = useConversationMessages(activeId);

  // Persist the turn's client-measured metrics per conversation so the timing
  // chip survives the remount that promoting a new chat to `/ai/chat/:id` causes
  // (the fresh `useChatStream` starts with `metrics: null`). Read back below.
  useEffect(() => {
    if (stream.metrics && activeId) lastTurnMetrics.set(activeId, stream.metrics);
  }, [stream.metrics, activeId]);
  const displayMetrics =
    stream.metrics ?? (activeId ? (lastTurnMetrics.get(activeId) ?? null) : null);

  // For new chats (selectedId was null on mount), the conversation list may not
  // have refreshed yet when the URL updates and remounts this surface. Sync the
  // workspace from the most recent assistant message once messages arrive.
  // Adjusting state during render (guarded so it fires once) is React's
  // recommended pattern here — no effect, no cascading-render lint warning.
  if (!workspaceSeeded) {
    const latest = messageQuery.messages.findLast((m) => m.role === 'assistant');
    if (latest?.workspaceKey) {
      setWorkspace(latest.workspaceKey);
      setWorkspaceSeeded(true);
    }
  }

  const prompts = useMemo<readonly PromptOption[]>(
    () =>
      picker.data?.categories.flatMap((category) =>
        category.prompts.map((prompt) => ({
          id: prompt.id,
          name: prompt.name,
          shortDescription: prompt.shortDescription,
          icon: prompt.icon,
          iconColor: prompt.iconColor,
        }))
      ) ?? [],
    [picker.data]
  );

  // From the admin workspace list, map each workspace key to its display label
  // (displayName, "GPT-4o") and, separately, to the raw model id it runs
  // ("deepseek-r1:7b"). The label drives the picker text; the model id drives the
  // brand icon — so a seeded workspace with no display label still shows the right
  // provider glyph while keeping the workspace key as its label.
  const { modelNameByKey, modelByKey } = useMemo(() => {
    const labels: Record<string, string | null> = {};
    const models: Record<string, string | null> = {};
    for (const ws of aiWorkspaces.data?.workspaces ?? []) {
      labels[ws.key] = ws.displayName;
      models[ws.key] = ws.model;
    }
    return { modelNameByKey: labels, modelByKey: models };
  }, [aiWorkspaces.data]);

  // Decorate the backend's flat workspace names with model marks + capability
  // glyphs so the composer renders its rich model picker.
  const workspaceOptions = useMemo(
    () => buildWorkspaceOptions(workspaces.data?.workspaces ?? [], t, modelNameByKey, modelByKey),
    [workspaces.data, t, modelNameByKey, modelByKey]
  );

  const messages = useMemo<readonly MessageResponse[]>(() => {
    const persisted = messageQuery.messages.map((message) => ({
      ...message,
      content: stripLeading(message.content),
    }));
    const pending = pendingUserText ? stripLeading(pendingUserText) : null;
    // Show the optimistic user bubble only until the finalized turn lands in the
    // messages cache (use-chat-stream appends it on completion); appending while
    // it is already present would duplicate the message.
    const alreadyPersisted = persisted.some(
      (message) => message.role === 'user' && message.content === pending
    );
    if (pending && stream.isStreaming && !alreadyPersisted) {
      return [
        ...persisted,
        {
          id: 'pending' as MessageResponse['id'],
          role: 'user',
          content: pending,
          workspaceKey: workspace ?? null,
          createdAt: new Date().toISOString() as MessageResponse['createdAt'],
        },
      ];
    }
    return persisted;
  }, [messageQuery.messages, pendingUserText, stream.isStreaming, workspace]);

  // Remember the last turn so a failed stream can be retried verbatim.
  const lastRequestRef = useRef<SendMessageRequest | null>(null);
  const send = (request: SendMessageRequest) => {
    lastRequestRef.current = request;
    setPendingUserText(request.message);
    stream.send({ ...request, conversationId: activeId ?? undefined, workspaceName: workspace });
  };

  // Stick to the latest message while streaming (only when the user is already
  // at the bottom), and load OLDER messages as they scroll up — keeping the
  // viewport anchored on prepend. Both behaviours share one scroller.
  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom();
  const topSentinelRef = useRef<HTMLDivElement>(null);
  useReverseInfiniteScroll({
    scrollContainerRef: scrollRef,
    topSentinelRef,
    itemCount: messageQuery.messages.length,
    hasMoreOlder: messageQuery.hasMoreOlder,
    isLoadingOlder: messageQuery.isLoadingOlder,
    loadOlder: messageQuery.loadOlder,
  });

  // Once a brand-new chat has produced its conversation id and finished
  // streaming, reflect it in the URL so the chat becomes shareable/reloadable.
  useEffect(() => {
    if (!selectedId && stream.conversationId && !stream.isStreaming) {
      navigate(`/ai/chat/${stream.conversationId}`, { replace: true });
    }
  }, [selectedId, stream.conversationId, stream.isStreaming, navigate]);

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} className="scrollbar-overlay h-full overflow-auto">
          <div ref={contentRef}>
            <div ref={topSentinelRef} aria-hidden />
            {messageQuery.isLoadingOlder ? (
              <div className="text-muted-foreground flex justify-center py-2" aria-hidden>
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : null}
            <ConversationThread
              messages={messages}
              streamingContent={stream.isStreaming ? stripLeading(stream.content) : undefined}
              isStreaming={stream.isStreaming}
              metrics={displayMetrics}
              toolCalls={stream.toolCalls}
              isThinking={stream.isThinking}
              errorKind={stream.errorKind}
              onRetry={() => {
                if (lastRequestRef.current) send(lastRequestRef.current);
              }}
              renderMessageActions={(message, index) => (
                <ChatMessageActions
                  content={message.content}
                  isAssistant={message.role === 'assistant'}
                  canRegenerate={message.role === 'assistant' && !stream.isStreaming}
                  canReport={message.role === 'assistant'}
                  onReport={(reason, category) =>
                    reportMessage.reportAsync({ messageId: message.id, reason, category })
                  }
                  onRegenerate={() => {
                    // Re-run the answer by re-sending the user turn that preceded it.
                    for (let i = index - 1; i >= 0; i -= 1) {
                      const previous = messages[i];
                      if (previous?.role === 'user') {
                        send({ message: previous.content });
                        return;
                      }
                    }
                  }}
                />
              )}
            />
            {stream.isStreaming &&
            !stripLeading(stream.content) &&
            stream.toolCalls.length === 0 ? (
              <div
                data-slot="chat-waiting"
                className="text-muted-foreground mt-2 flex items-center gap-2 text-sm"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t('AiChat.Thinking', 'Assistant is thinking…')}
              </div>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <ScrollToBottomButton
            visible={!isAtBottom}
            onClick={() => {
              scrollToBottom();
            }}
            className="pointer-events-auto"
          />
        </div>
      </div>

      {stream.suggestedActions.length > 0 ? (
        <SuggestedActions
          actions={stream.suggestedActions}
          onSelect={(action) => {
            navigate(action.deepLink);
          }}
        />
      ) : null}

      {stream.clarification ? (
        <ClarificationPrompt
          clarification={stream.clarification}
          disabled={stream.isStreaming}
          onChoose={(answer) => {
            send({ message: answer });
          }}
        />
      ) : null}

      <ChatComposer
        prompts={prompts}
        uploadAttachment={uploadAttachment}
        attachAccept={CHAT_ATTACHMENT_ACCEPT}
        workspaceOptions={workspaceOptions}
        workspace={workspace}
        onWorkspaceChange={setWorkspace}
        isStreaming={stream.isStreaming}
        onStop={stream.abort}
        onSubmit={send}
      />
    </section>
  );
}
