// @granit/react-ui-rich-text — i18next resource bundle (flat keys, "translation" ns).
// All editor labels also pass a `defaultValue`, so the editor is fully usable
// without registering this bundle; register it to localize the toolbar.

export const richTextTranslationsEn = {
  'RichText.Bold': 'Bold',
  'RichText.Italic': 'Italic',
  'RichText.Underline': 'Underline',
  'RichText.Strikethrough': 'Strikethrough',
  'RichText.Paragraph': 'Paragraph',
  'RichText.Heading1': 'Heading 1',
  'RichText.Heading2': 'Heading 2',
  'RichText.Heading3': 'Heading 3',
  'RichText.Heading4': 'Heading 4',
  'RichText.AlignLeft': 'Align left',
  'RichText.AlignCenter': 'Align center',
  'RichText.AlignRight': 'Align right',
  'RichText.AlignJustify': 'Justify',
  'RichText.Lists': 'Lists',
  'RichText.BulletList': 'Bullet list',
  'RichText.OrderedList': 'Ordered list',
  'RichText.TaskList': 'Task list',
  'RichText.Blockquote': 'Quote',
  'RichText.Link': 'Link',
  'RichText.Unlink': 'Remove link',
  'RichText.LinkPrompt': 'URL',
  'RichText.Undo': 'Undo',
  'RichText.Redo': 'Redo',
  'RichText.Content': 'Editor content',
  'RichText.Slash.Paragraph': 'Text',
  'RichText.Slash.Heading1': 'Heading 1',
  'RichText.Slash.Heading2': 'Heading 2',
  'RichText.Slash.Heading3': 'Heading 3',
  'RichText.Slash.BulletList': 'Bullet list',
  'RichText.Slash.OrderedList': 'Ordered list',
  'RichText.Slash.TaskList': 'Task list',
  'RichText.Slash.Quote': 'Quote',
  'RichText.Slash.CodeBlock': 'Code block',
} as const;

export type RichTextTranslations = typeof richTextTranslationsEn;
