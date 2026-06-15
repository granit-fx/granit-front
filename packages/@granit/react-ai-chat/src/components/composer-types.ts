import type { MentionRequest, PromptId } from '@granit/ai-chat';

/** A `/` prompt-badge option shown in the prompt picker. */
export interface PromptOption {
  readonly id: PromptId;
  readonly name: string;
  readonly shortDescription?: string | null;
  /** Icon identifier owned by the host app's glyph set. */
  readonly icon?: string | null;
  readonly iconColor?: string | null;
}

/** An `@` mention option resolved by the app-specific `searchMentions` adapter. */
export interface MentionOption {
  readonly type: string;
  readonly id: string;
  readonly label: string;
  readonly description?: string | null;
}

/** A mention staged in the composer (kept for the request's `mentions` array). */
export interface StagedMention extends MentionRequest {
  readonly label: string;
}

/**
 * App-specific search for `@` mention candidates. There is no generic
 * mention-search endpoint — the host implements this against its entity APIs.
 */
export type SearchMentions = (query: string) => Promise<readonly MentionOption[]>;

/**
 * App-specific attachment upload: push the file to the app's blob store and
 * return the opaque reference the backend reads back. Reject to surface an
 * error chip.
 */
export type UploadAttachment = (file: File) => Promise<{
  readonly reference: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number | string;
}>;
