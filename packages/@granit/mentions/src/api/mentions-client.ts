import {
  DEFAULT_LOOKUP_BASE_PATH,
  resolveLookup,
  searchLookup,
  stringifyLookupValue,
} from '@granit/data-lookup';

import type { MentionItem } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { LookupItemResponse } from '@granit/data-lookup';

/**
 * Registry name of the single facade lookup source that fans the `@`-mention picker
 * across every source tagged mentionable on the backend (`Granit.Mentions`).
 */
export const MENTIONS_SOURCE = 'mentions';

/** Parameters for {@link searchMentions}. */
export interface SearchMentionsParams {
  /** Free-text query; an empty string returns the backend's top default set. */
  readonly search: string;
  /** Narrow to a single mention type (`scope.type=<type>`); omit for all types. */
  readonly type?: string;
}

/** Shared options for the mention client calls. */
export interface MentionClientOptions {
  readonly signal?: AbortSignal;
}

/**
 * Searches the `@`-mention picker via the unified `GET /lookups/mentions` facade source.
 * Multi-type by default; pass `type` to restrict to one source (`scope.type`).
 */
export async function searchMentions(
  client: AxiosInstance,
  params: SearchMentionsParams,
  options: MentionClientOptions = {}
): Promise<readonly MentionItem[]> {
  const result = await searchLookup(
    { name: MENTIONS_SOURCE },
    { search: params.search, scope: params.type ? { type: params.type } : undefined },
    { client, basePath: DEFAULT_LOOKUP_BASE_PATH, signal: options.signal }
  );
  return result.items.map(toMentionItem);
}

/**
 * Resolves a previously selected composite value (`"<type>:<id>"`) back to a
 * {@link MentionItem} for rehydration. Returns `null` when the value is unknown (HTTP 404).
 */
export async function resolveMention(
  client: AxiosInstance,
  value: string,
  options: MentionClientOptions = {}
): Promise<MentionItem | null> {
  const item = await resolveLookup({ name: MENTIONS_SOURCE }, value, {
    client,
    basePath: DEFAULT_LOOKUP_BASE_PATH,
    signal: options.signal,
  });
  return item ? toMentionItem(item) : null;
}

/**
 * Splits a composite mention value (`"<type>:<id>"`) into its parts. When no `:` is
 * present the whole value is treated as the id and `type` is empty.
 */
export function parseMentionValue(value: string): { type: string; id: string } {
  const sep = value.indexOf(':');
  return sep >= 0
    ? { type: value.slice(0, sep), id: value.slice(sep + 1) }
    : { type: '', id: value };
}

/** Normalizes a raw lookup item into a {@link MentionItem}. */
function toMentionItem(item: LookupItemResponse): MentionItem {
  const value = stringifyLookupValue(item.value);
  const parsed = parseMentionValue(value);
  const type = typeof item.extra?.type === 'string' ? item.extra.type : parsed.type;
  return { type, id: parsed.id, label: item.label, extra: item.extra };
}
