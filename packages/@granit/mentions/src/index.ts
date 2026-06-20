// ---------------------------------------------------------------------------
// @granit/mentions — public API (framework-agnostic)
// ---------------------------------------------------------------------------
//
// The @-mention picker client: a thin facade over @granit/data-lookup that binds the
// 'mentions' source (GET /lookups/mentions) and the composite `type:id` value convention.
// Mirrors the backend `Granit.Mentions` boundary — there is no mention-specific wire DTO.

// Types
export type { MentionItem } from './types/index';

// HTTP client
export { MENTIONS_SOURCE, parseMentionValue, resolveMention, searchMentions } from './api/index';
export type { MentionClientOptions, SearchMentionsParams } from './api/index';
