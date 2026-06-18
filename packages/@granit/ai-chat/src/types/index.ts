import type { EntityId, ISODateString, UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Types mirroring Granit.AI.Chat and Granit.AI.Chat.Endpoints .NET contracts.
// Property names match the camelCase JSON serialization from the backend.
// Optionality follows the OpenAPI `required` array, not C# nullability.
// ---------------------------------------------------------------------------

// -- Branded identifiers -----------------------------------------------------

/** Conversation identifier (UUID). */
export type ConversationId = EntityId<'Conversation'>;

/** Chat message identifier (UUID). */
export type MessageId = EntityId<'Message'>;

/** Prompt-catalogue template identifier (UUID). Owned by the prompts module. */
export type PromptId = EntityId<'Prompt'>;

// -- Constants ---------------------------------------------------------------

/**
 * The reserved workspace name that lets the backend pick the workspace for the
 * turn. Always listed first by `GET /conversations/workspaces`.
 */
export const AUTO_WORKSPACE = 'Auto';

/**
 * `ChatStreamEvent.type` discriminator values. The stream ends when the
 * connection closes — there is no `[DONE]` sentinel.
 */
export const CHAT_STREAM_EVENT_TYPES = {
  /** First frame — carries the new/continued `conversationId`. */
  CONVERSATION: 'conversation',
  /** Incremental answer chunk — append `content` in order. */
  DELTA: 'delta',
  /**
   * A tool started — carries `toolName` + `toolCallId`. Render a "running" chip
   * keyed by `toolCallId`. Emitted once per call; correlate with `tool_result`.
   */
  TOOL_CALL: 'tool_call',
  /**
   * A tool finished — same `toolName` + `toolCallId`, plus `succeeded`. Resolve
   * the matching chip to ✓/✗. Emitted once per call.
   */
  TOOL_RESULT: 'tool_result',
  /** Token counts, near the end of the stream. */
  USAGE: 'usage',
  /** Suggested deep-link actions to render — never auto-invoked. */
  SUGGESTIONS: 'suggestions',
  /** The turn is blocked on a clarifying question. */
  CLARIFICATION: 'clarification',
} as const;

/** Discriminator union for {@link ChatStreamEvent.type}. */
export type ChatStreamEventType =
  (typeof CHAT_STREAM_EVENT_TYPES)[keyof typeof CHAT_STREAM_EVENT_TYPES];

/** Role of a persisted chat message. */
export type ChatMessageRole = 'user' | 'assistant' | 'system';

/** Server-enforced limits for a single `SendMessageRequest` turn. */
export const SEND_MESSAGE_LIMITS = {
  /** `message` maximum length. */
  MESSAGE_MAX_LENGTH: 16_000,
  /** Maximum `@` mentions per turn. */
  MENTIONS_MAX: 25,
  /** Maximum `/` prompt badges per turn. */
  PROMPT_REFS_MAX: 5,
  /** Documented default maximum attachments per turn (server-configurable). */
  ATTACHMENTS_MAX: 5,
} as const;

/** `title` maximum length for create/rename conversation requests. */
export const CONVERSATION_TITLE_MAX_LENGTH = 500;

/** `reason` maximum length for a {@link ReportMessageRequest}. */
export const REPORT_REASON_MAX_LENGTH = 2000;

/**
 * The closed set of categories a user may attach to a message report. Mirrors
 * `Granit.AI.Chat.Domain.MessageReportCategory`; the values are the PascalCase
 * enum names the backend's default `JsonStringEnumConverter` accepts.
 */
export const MESSAGE_REPORT_CATEGORIES = {
  /** The answer is factually wrong or misleading. */
  INACCURATE: 'Inaccurate',
  /** The content is harmful, unsafe, or offensive. */
  HARMFUL: 'Harmful',
  /** Any other reason; the free-text reason carries the detail. */
  OTHER: 'Other',
} as const;

/** A report category value. @see MESSAGE_REPORT_CATEGORIES */
export type MessageReportCategory =
  (typeof MESSAGE_REPORT_CATEGORIES)[keyof typeof MESSAGE_REPORT_CATEGORIES];

// -- Composer inputs ---------------------------------------------------------

/** An `@` mention the server resolves to grounded, untrusted context. */
export interface MentionRequest {
  readonly type: string;
  readonly id: string;
}

/**
 * An app-uploaded attachment. The front uploads the blob to the app's own
 * store, then sends this opaque reference; the backend reads the bytes back.
 */
export interface AttachmentRequest {
  readonly reference: string;
  readonly fileName: string;
  readonly contentType: string;
  /** int64 — surfaces as `number | string` in generated clients. */
  readonly sizeBytes: number | string;
}

/** Body of `POST /conversations/messages`. */
export interface SendMessageRequest {
  readonly message: string;
  readonly conversationId?: ConversationId | null;
  readonly workspaceName?: string | null;
  readonly mentions?: readonly MentionRequest[] | null;
  readonly attachments?: readonly AttachmentRequest[] | null;
  readonly promptRefs?: readonly PromptId[] | null;
}

// -- Stream events -----------------------------------------------------------

/** A suggested deep-link action streamed by the agent. Never auto-invoked. */
export interface SuggestedActionResponse {
  readonly type: string;
  readonly label: string;
  readonly deepLink: string;
  readonly description?: string | null;
}

/** One clickable option for a clarifying question. */
export interface ClarificationOptionResponse {
  readonly label: string;
  /** The value sent as the next message; falls back to `label` when null. */
  readonly value: string | null;
}

/** A clarifying question that blocks the turn until the user answers. */
export interface ClarificationResponse {
  readonly question: string;
  readonly options: readonly ClarificationOptionResponse[];
  readonly allowOther: boolean;
}

/**
 * A single Server-Sent Event frame from `POST /conversations/messages`.
 * Discriminated by {@link ChatStreamEvent.type}; only the fields relevant to
 * that type are populated.
 *
 * ⚠️ `content` is **untrusted** model output — steerable by prompt injection,
 * poisoned RAG, or echoed tool results. Render it as plain text, or sanitize
 * it (and scheme-allowlist any links) before rendering as HTML/markdown. Never
 * pass it to a DOM HTML sink unsanitized.
 */
export interface ChatStreamEvent {
  readonly type: ChatStreamEventType;
  readonly content?: string | null;
  readonly conversationId?: ConversationId | null;
  readonly inputTokens?: number | null;
  readonly outputTokens?: number | null;
  readonly suggestedActions?: readonly SuggestedActionResponse[] | null;
  readonly clarification?: ClarificationResponse | null;
  /**
   * Tool identity on `tool_call`/`tool_result` frames. The model-facing name
   * (`snake_case`, e.g. `query_data`); map it to a localized label. The wire
   * carries **neither the arguments nor the raw result** (privacy) — never
   * derive UI from anything but the name and {@link succeeded}.
   */
  readonly toolName?: string | null;
  /**
   * Correlation id shared by a `tool_call` and its `tool_result`. Key tool
   * chips by this — order between concurrent tools is not guaranteed.
   */
  readonly toolCallId?: string | null;
  /** Whether the tool succeeded. Present only on `tool_result` frames. */
  readonly succeeded?: boolean | null;
}

// -- Conversation CRUD -------------------------------------------------------

/** A persisted message within a conversation. */
export interface MessageResponse {
  readonly id: MessageId;
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly createdAt: ISODateString;
}

/** A conversation with its messages. */
export interface ConversationResponse {
  readonly id: ConversationId;
  readonly title: string;
  readonly ownerId: UserId;
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString | null;
  readonly messages: readonly MessageResponse[];
}

/** A conversation list item, without its messages. */
export interface ConversationSummaryResponse {
  readonly id: ConversationId;
  readonly title: string;
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString | null;
}

/** Body of `POST /conversations`. */
export interface CreateConversationRequest {
  readonly title: string;
}

/** Body of `PUT /conversations/{id}/title`. */
export interface RenameConversationRequest {
  readonly title: string;
}

/**
 * Body of `POST /conversations/messages/{messageId}/report`.
 *
 * Per ADR-071 a report carries only the user-entered reason and an optional
 * category — never the message content or its tool activity.
 */
export interface ReportMessageRequest {
  readonly reason: string;
  readonly category?: MessageReportCategory | null;
}

/** The workspaces a user may set as their default chat workspace. */
export interface ChatWorkspacesResponse {
  readonly workspaces: readonly string[];
}
