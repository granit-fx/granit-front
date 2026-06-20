import type { MentionRequest, PromptId } from '@granit/ai-chat';
import type { ReactNode } from 'react';

/**
 * Rich metadata for a workspace/model option, used to render the workspace
 * selector as a model picker (leading mark, capability glyphs, provider
 * grouping). Brand-agnostic: the host supplies every glyph ({@link icon},
 * {@link capabilities}) — the framework never hardcodes a provider mark.
 */
export interface WorkspaceOption {
  /** Value submitted to the backend; matches an entry in `workspaces`. */
  readonly value: string;
  /** Display label; defaults to {@link value}. */
  readonly label?: string;
  /** Leading glyph identifying the model/provider. */
  readonly icon?: ReactNode;
  /** Trailing capability glyphs (e.g. vision, tools, reasoning). */
  readonly capabilities?: readonly ReactNode[];
  /** Provider/section heading this option is grouped under. */
  readonly group?: string;
  /** Render the option as locked/unavailable — listed but not selectable. */
  readonly disabled?: boolean;
}

/** A `/` prompt-badge option shown in the prompt picker. */
export interface PromptOption {
  readonly id: PromptId;
  readonly name: string;
  readonly shortDescription?: string | null;
  /** Icon identifier owned by the host app's glyph set. */
  readonly icon?: string | null;
  readonly iconColor?: string | null;
}

/**
 * An `@` mention option resolved by `searchMentions` — the provider-backed
 * generic search by default, or a host-supplied adapter. Mirrors the backend's
 * `MentionSuggestionResponse` 1:1.
 */
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
 * Search for `@` mention candidates. The composer defaults to the unified,
 * ACL-bound `GET /conversations/mentions` endpoint (via `useDefaultMentionSearch`);
 * a host may pass its own adapter to override it (e.g. to scope or decorate
 * results). Empty `query` should return the top default suggestions.
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
