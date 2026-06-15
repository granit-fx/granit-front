import type { EntityId, ISODateString, UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Types mirroring Granit.AI.Prompts and Granit.AI.Prompts.Endpoints .NET
// contracts. Property names match the camelCase JSON from the backend.
// Optionality follows the OpenAPI `required` array, not C# nullability:
// `icon` / `iconColor` are required keys with nullable values (`T | null`).
// ---------------------------------------------------------------------------

// -- Branded identifiers -----------------------------------------------------

/** Prompt-template identifier (UUID). */
export type PromptId = EntityId<'Prompt'>;

/** Taxonomy category identifier (UUID). */
export type CategoryId = EntityId<'Category'>;

// -- Constants ---------------------------------------------------------------

/** Server-enforced limits for prompt create/update requests. */
export const PROMPT_LIMITS = {
  /** `name` maximum length. */
  NAME_MAX_LENGTH: 200,
  /** `content` (instruction text) maximum length. */
  CONTENT_MAX_LENGTH: 20_000,
  /** `shortDescription` maximum length. */
  SHORT_DESCRIPTION_MAX_LENGTH: 500,
  /** `icon` identifier maximum length. */
  ICON_MAX_LENGTH: 100,
} as const;

/**
 * Validates `iconColor`: a hex string `#RRGGBB` or `#RRGGBBAA`. Mirrors the
 * backend `Validation:Format:ColorHex` rule.
 */
export const ICON_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Group name for uncategorised prompts in the picker. */
export const GENERAL_CATEGORY_NAME = 'General';

// -- Read models -------------------------------------------------------------

/** A catalogue list item, without its instruction text. */
export interface PromptSummaryResponse {
  readonly id: PromptId;
  readonly name: string;
  readonly shortDescription: string;
  /** Icon identifier — the front owns the glyph set. */
  readonly icon: string | null;
  /** Hex colour `#RRGGBB` / `#RRGGBBAA`. */
  readonly iconColor: string | null;
  /** System prompts are read-only — offer Customise instead of Edit/Delete. */
  readonly isSystem: boolean;
  readonly categoryIds: readonly CategoryId[];
}

/** A full prompt with its instruction text. */
export interface PromptResponse {
  readonly id: PromptId;
  readonly name: string;
  readonly shortDescription: string;
  readonly content: string;
  readonly icon: string | null;
  readonly iconColor: string | null;
  readonly version: number;
  readonly isSystem: boolean;
  readonly ownerId: UserId;
  readonly categoryIds: readonly CategoryId[];
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString | null;
}

/** One prompt entry in the `/` picker (no instruction text). */
export interface PromptPickerItemResponse {
  readonly id: PromptId;
  readonly name: string;
  readonly shortDescription: string;
  readonly icon: string | null;
  readonly iconColor: string | null;
  readonly isSystem: boolean;
}

/** A picker group. `categoryId` is null for the "General" group. */
export interface PromptPickerCategoryResponse {
  readonly categoryId: CategoryId | null;
  readonly categoryName: string;
  readonly prompts: readonly PromptPickerItemResponse[];
}

/** The `/` picker payload — the catalogue grouped by category. */
export interface PromptPickerResponse {
  readonly categories: readonly PromptPickerCategoryResponse[];
}

// -- Write models ------------------------------------------------------------

/** Body of `POST /prompts`. */
export interface CreatePromptRequest {
  readonly name: string;
  readonly content: string;
  readonly shortDescription?: string | null;
  readonly icon?: string | null;
  readonly iconColor?: string | null;
  readonly categoryIds?: readonly CategoryId[] | null;
}

/** Body of `PUT /prompts/{id}`. Same shape as create. */
export interface UpdatePromptRequest {
  readonly name: string;
  readonly content: string;
  readonly shortDescription?: string | null;
  readonly icon?: string | null;
  readonly iconColor?: string | null;
  readonly categoryIds?: readonly CategoryId[] | null;
}
