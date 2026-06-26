// @granit/react-rich-text — shared TipTap-based rich-text editor (HTML in / out).
// The base every Granit HTML editor composes; feature packages wrap it and inject
// their own toolbar controls via `RichTextEditorProps.toolbarExtras`.

export { RichTextEditor } from './rich-text-editor';
export type { RichTextEditorHandle, RichTextEditorProps } from './rich-text-editor';

// Notion-style `/` block menu — exported so apps can compose their own block list.
export { SlashCommand, createDefaultSlashItems } from './slash-command';
export type { SlashCommandItem, SlashCommandOptions } from './slash-command';

// i18next resource bundles (flat keys, "translation" ns). Optional — every label
// also passes a defaultValue, so the editor is usable without registering these.
export { richTextTranslationsEn, richTextTranslationsFr } from './locales';
export type { RichTextTranslations } from './locales';
