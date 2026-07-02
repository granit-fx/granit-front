import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  Link as LinkIcon,
  List,
  ListCheck,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Unlink,
  Undo,
} from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  type ReactNode,
} from 'react';

import { SlashCommand, createDefaultSlashItems } from './slash-command';

import type { Editor } from '@tiptap/react';

/**
 * Imperative handle exposed by {@link RichTextEditor}. Lets a parent inject
 * text at the caret (e.g. a template-variable picker) without owning the
 * TipTap instance.
 */
export interface RichTextEditorHandle {
  insertAtCursor: (text: string) => void;
}

export interface RichTextEditorProps {
  /** Current HTML value (controlled). */
  readonly value: string;
  /** Fires with the editor's serialized HTML on every change. */
  readonly onChange: (value: string) => void;
  readonly className?: string;
  readonly readOnly?: boolean;
  /** Placeholder shown while the document is empty. */
  readonly placeholder?: string;
  /** Accessible label for the editable region. */
  readonly ariaLabel?: string;
  /**
   * Extra controls rendered at the far (right) end of the toolbar — e.g. a
   * "switch to code" toggle or a domain-specific variable picker. The host
   * owns these; the editor only reserves the slot.
   */
  readonly toolbarExtras?: ReactNode;
}

/**
 * Generic TipTap-based rich-text editor (HTML in / HTML out). The shared base
 * every Granit HTML editor composes — feature packages wrap it and inject
 * their own controls via {@link RichTextEditorProps.toolbarExtras}.
 *
 * Headless of any backend: it only knows HTML strings. Wire `value`/`onChange`
 * to your form state.
 */
export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    { value, onChange, className, readOnly = false, placeholder, ariaLabel, toolbarExtras },
    ref
  ) {
    const { t } = useTranslation();
    const slashItems = useMemo(() => createDefaultSlashItems(t), [t]);

    const editor = useEditor({
      extensions: [
        // StarterKit v3 bundles Link and Underline. Configure them here instead
        // of importing them separately to avoid duplicate extension names.
        StarterKit.configure({
          link: { openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } },
        }),
        Placeholder.configure({ placeholder: placeholder ?? '' }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        // Notion-style `/` block menu.
        SlashCommand.configure({
          items: (query) =>
            slashItems.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
        }),
      ],
      content: value,
      editable: !readOnly,
      // Defer creation until after mount so React 19 StrictMode's double-invocation
      // doesn't leave a destroyed editor instance behind (which crashes toolbar/effects).
      immediatelyRender: false,
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
    });

    // Sync external value changes (e.g. form reset) without cursor jump.
    // Guard with `isDestroyed` — under StrictMode / Activity remounts, the
    // effect can fire after TipTap has torn down the schema, and any call
    // into the editor (getHTML, setContent) then crashes inside
    // ProseMirror's DOMSerializer.
    useEffect(() => {
      if (!editor || editor.isDestroyed) return;
      if (editor.getHTML() !== value) {
        editor.commands.setContent(value, { emitUpdate: false });
      }
    }, [editor, value]);

    useEffect(() => {
      if (!editor || editor.isDestroyed) return;
      editor.setEditable(!readOnly);
    }, [editor, readOnly]);

    const insertAtCursor = useCallback(
      (text: string) => {
        if (!editor || editor.isDestroyed) return;
        editor.chain().focus().insertContent(text).run();
      },
      [editor]
    );

    useImperativeHandle(ref, () => ({ insertAtCursor }), [insertAtCursor]);

    if (!editor) return null;

    return (
      <div
        data-slot="rich-text-editor"
        className={cn('rounded-md border bg-background', className)}
      >
        <RichTextToolbar editor={editor} readOnly={readOnly} toolbarExtras={toolbarExtras} />
        {readOnly ? null : (
          <BubbleMenu
            editor={editor}
            data-slot="rich-text-bubble-menu"
            className="flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md"
          >
            <BubbleButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              label={t('RichText.Bold', { defaultValue: 'Bold' })}
            >
              <Bold className="h-4 w-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              label={t('RichText.Italic', { defaultValue: 'Italic' })}
            >
              <Italic className="h-4 w-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              label={t('RichText.Underline', { defaultValue: 'Underline' })}
            >
              <UnderlineIcon className="h-4 w-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              label={t('RichText.Strikethrough', { defaultValue: 'Strikethrough' })}
            >
              <Strikethrough className="h-4 w-4" />
            </BubbleButton>
          </BubbleMenu>
        )}
        <EditorContent
          editor={editor}
          className={cn(
            '[&_.tiptap]:min-h-[400px] [&_.tiptap]:px-4 [&_.tiptap]:py-3 [&_.tiptap]:text-sm [&_.tiptap]:leading-relaxed [&_.tiptap]:outline-none',
            '[&_.tiptap]:focus-visible:ring-2 [&_.tiptap]:focus-visible:ring-ring [&_.tiptap]:focus-visible:ring-offset-2',
            '[&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-3',
            '[&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:mb-2',
            '[&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-medium [&_.tiptap_h3]:mb-2',
            '[&_.tiptap_p]:mb-2',
            '[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ul]:mb-2',
            '[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_ol]:mb-2',
            '[&_.tiptap_li]:mb-1',
            '[&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-muted-foreground/30 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:mb-2',
            '[&_.tiptap_ul[data-type=taskList]]:list-none [&_.tiptap_ul[data-type=taskList]]:pl-1',
            '[&_.tiptap_ul[data-type=taskList]_li]:flex [&_.tiptap_ul[data-type=taskList]_li]:items-start [&_.tiptap_ul[data-type=taskList]_li]:gap-2',
            '[&_.tiptap_ul[data-type=taskList]_li_label]:mt-0.5',
            '[&_.tiptap_code]:bg-muted [&_.tiptap_code]:rounded [&_.tiptap_code]:px-1 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:font-mono [&_.tiptap_code]:text-xs',
            '[&_.tiptap_a]:text-primary [&_.tiptap_a]:underline',
            '[&_.tiptap_.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.tiptap_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_.is-editor-empty:first-child::before]:float-left [&_.tiptap_.is-editor-empty:first-child::before]:h-0 [&_.tiptap_.is-editor-empty:first-child::before]:pointer-events-none'
          )}
          aria-label={ariaLabel ?? t('RichText.Content', { defaultValue: 'Editor content' })}
        />
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  readonly action: () => boolean | void;
  readonly isActive?: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly disabled?: boolean;
}

function ToolbarButton({ action, isActive, icon, label, disabled }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', isActive && 'bg-accent text-accent-foreground')}
          onClick={(e) => {
            e.preventDefault();
            action();
          }}
          disabled={disabled}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// Selection ("bubble") menu button — no tooltip (the bubble floats outside the
// toolbar's TooltipProvider). `onMouseDown` preventDefault keeps the selection
// alive so the command applies to the still-selected text.
function BubbleButton({
  onClick,
  active,
  label,
  children,
}: {
  readonly onClick: () => void;
  readonly active?: boolean;
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-7 w-7', active && 'bg-accent text-accent-foreground')}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

interface RichTextToolbarProps {
  readonly editor: Editor;
  readonly readOnly: boolean;
  readonly toolbarExtras?: ReactNode;
}

function RichTextToolbar({ editor, readOnly, toolbarExtras }: RichTextToolbarProps) {
  const { t } = useTranslation();

  const handleSetLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = globalThis.prompt(
      t('RichText.LinkPrompt', { defaultValue: 'URL' }),
      previousUrl ?? 'https://'
    );
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor, t]);

  if (readOnly) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        data-slot="rich-text-toolbar"
        className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1"
      >
        <ToolbarButton
          action={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={<Bold className="h-4 w-4" />}
          label={t('RichText.Bold', { defaultValue: 'Bold' })}
        />
        <ToolbarButton
          action={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={<Italic className="h-4 w-4" />}
          label={t('RichText.Italic', { defaultValue: 'Italic' })}
        />
        <ToolbarButton
          action={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={<UnderlineIcon className="h-4 w-4" />}
          label={t('RichText.Underline', { defaultValue: 'Underline' })}
        />
        <ToolbarButton
          action={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={<Strikethrough className="h-4 w-4" />}
          label={t('RichText.Strikethrough', { defaultValue: 'Strikethrough' })}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <HeadingDropdown editor={editor} />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          action={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={<AlignLeft className="h-4 w-4" />}
          label={t('RichText.AlignLeft', { defaultValue: 'Align left' })}
        />
        <ToolbarButton
          action={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={<AlignCenter className="h-4 w-4" />}
          label={t('RichText.AlignCenter', { defaultValue: 'Align center' })}
        />
        <ToolbarButton
          action={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={<AlignRight className="h-4 w-4" />}
          label={t('RichText.AlignRight', { defaultValue: 'Align right' })}
        />
        <ToolbarButton
          action={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          icon={<AlignJustify className="h-4 w-4" />}
          label={t('RichText.AlignJustify', { defaultValue: 'Justify' })}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ListDropdown editor={editor} />
        <ToolbarButton
          action={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={<Quote className="h-4 w-4" />}
          label={t('RichText.Blockquote', { defaultValue: 'Quote' })}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          action={handleSetLink}
          isActive={editor.isActive('link')}
          icon={<LinkIcon className="h-4 w-4" />}
          label={t('RichText.Link', { defaultValue: 'Link' })}
        />
        <ToolbarButton
          action={() => editor.chain().focus().unsetLink().run()}
          icon={<Unlink className="h-4 w-4" />}
          label={t('RichText.Unlink', { defaultValue: 'Remove link' })}
          disabled={!editor.isActive('link')}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          action={() => editor.chain().focus().undo().run()}
          icon={<Undo className="h-4 w-4" />}
          label={t('RichText.Undo', { defaultValue: 'Undo' })}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          action={() => editor.chain().focus().redo().run()}
          icon={<Redo className="h-4 w-4" />}
          label={t('RichText.Redo', { defaultValue: 'Redo' })}
          disabled={!editor.can().redo()}
        />

        {toolbarExtras ? (
          <>
            <div className="flex-1" />
            {toolbarExtras}
          </>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Heading dropdown
// ---------------------------------------------------------------------------

const HEADING_OPTIONS = [
  { level: 0, icon: Pilcrow },
  { level: 1, icon: () => <span className="text-sm font-bold">H1</span> },
  { level: 2, icon: () => <span className="text-sm font-semibold">H2</span> },
  { level: 3, icon: () => <span className="text-sm font-medium">H3</span> },
  { level: 4, icon: () => <span className="text-xs font-medium">H4</span> },
] as const;

function HeadingDropdown({ editor }: { readonly editor: Editor }) {
  const { t } = useTranslation();

  const activeLevel = HEADING_OPTIONS.find(
    (opt) => opt.level > 0 && editor.isActive('heading', { level: opt.level })
  );

  const ActiveIcon = activeLevel?.icon ?? Pilcrow;
  const activeLabel = activeLevel
    ? t(`RichText.Heading${activeLevel.level}`, { defaultValue: `Heading ${activeLevel.level}` })
    : t('RichText.Paragraph', { defaultValue: 'Paragraph' });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          aria-label={activeLabel}
        >
          <ActiveIcon className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {HEADING_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive =
            opt.level === 0
              ? !editor.isActive('heading')
              : editor.isActive('heading', { level: opt.level });
          const label =
            opt.level === 0
              ? t('RichText.Paragraph', { defaultValue: 'Paragraph' })
              : t(`RichText.Heading${opt.level}`, { defaultValue: `Heading ${opt.level}` });

          return (
            <DropdownMenuItem
              key={opt.level}
              className={cn('gap-2', isActive && 'bg-accent')}
              onSelect={() => {
                if (opt.level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({ level: opt.level }).run();
                }
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// List dropdown
// ---------------------------------------------------------------------------

function ListDropdown({ editor }: { readonly editor: Editor }) {
  const { t } = useTranslation();

  let ActiveIcon = List;
  if (editor.isActive('orderedList')) ActiveIcon = ListOrdered;
  else if (editor.isActive('taskList')) ActiveIcon = ListCheck;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          aria-label={t('RichText.Lists', { defaultValue: 'Lists' })}
        >
          <ActiveIcon className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        <DropdownMenuItem
          className={cn('gap-2', editor.isActive('bulletList') && 'bg-accent')}
          onSelect={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
          {t('RichText.BulletList', { defaultValue: 'Bullet list' })}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn('gap-2', editor.isActive('orderedList') && 'bg-accent')}
          onSelect={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
          {t('RichText.OrderedList', { defaultValue: 'Ordered list' })}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn('gap-2', editor.isActive('taskList') && 'bg-accent')}
          onSelect={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListCheck className="h-4 w-4" />
          {t('RichText.TaskList', { defaultValue: 'Task list' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
