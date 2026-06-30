/**
 * Translation shape for the headless `@granit/react-ai-prompts` package. The
 * styled catalogue / form / picker UI (and its user-facing strings) now lives in
 * `@granit/react-ui-ai-prompts`; the only component shipped here is the
 * framework-agnostic `PromptIcon` glyph renderer, which renders no text. The
 * bundle is therefore intentionally empty but kept exported so hosts can still
 * register the `aiPrompts` namespace without a breaking import change.
 */
export type PromptTranslations = Record<string, never>;

export const aiPromptsTranslationsEn: PromptTranslations = {};
