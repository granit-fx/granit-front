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
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
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
import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';

import { InsertVariableButton } from './insert-variable-button';

import type { TemplateEditorHandle } from './template-editor';
import type { Editor } from '@tiptap/react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
  templateName?: string;
  onSwitchToCode?: () => void;
}

export const RichTextEditor = forwardRef<TemplateEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    { value, onChange, className, readOnly = false, templateName, onSwitchToCode },
    ref
  ) {
    const { t } = useTranslation();

    const editor = useEditor({
      extensions: [
        // StarterKit v3 bundles Link and Underline. Configure them here instead
        // of importing them separately to avoid duplicate extension names.
        StarterKit.configure({
          link: { openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } },
        }),
        Placeholder.configure({ placeholder: '<h1>{{ model.title }}</h1>' }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TaskList,
        TaskItem.configure({ nested: true }),
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

    // Sync readOnly
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
        <RichTextToolbar
          editor={editor}
          readOnly={readOnly}
          templateName={templateName}
          onSwitchToCode={onSwitchToCode}
        />
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
          aria-label={t('Templates.Editor.Content')}
        />
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  editor: Editor;
  action: () => boolean | void;
  isActive?: boolean;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

function ToolbarButton({ action, isActive, icon, label, disabled }: Readonly<ToolbarButtonProps>) {
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

interface RichTextToolbarProps {
  editor: Editor;
  readOnly: boolean;
  templateName?: string;
  onSwitchToCode?: () => void;
}

function RichTextToolbar({
  editor,
  readOnly,
  templateName,
  onSwitchToCode,
}: Readonly<RichTextToolbarProps>) {
  const { t } = useTranslation();

  const handleSetLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = globalThis.prompt(
      t('Templates.Editor.LinkPrompt', 'URL'),
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
        {/* Text formatting */}
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={<Bold className="h-4 w-4" />}
          label={t('Templates.Editor.Bold', 'Bold')}
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={<Italic className="h-4 w-4" />}
          label={t('Templates.Editor.Italic', 'Italic')}
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={<UnderlineIcon className="h-4 w-4" />}
          label={t('Templates.Editor.Underline', 'Underline')}
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={<Strikethrough className="h-4 w-4" />}
          label={t('Templates.Editor.Strikethrough', 'Strikethrough')}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings dropdown */}
        <HeadingDropdown editor={editor} />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Alignment */}
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={<AlignLeft className="h-4 w-4" />}
          label={t('Templates.Editor.AlignLeft', 'Align left')}
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={<AlignCenter className="h-4 w-4" />}
          label={t('Templates.Editor.AlignCenter', 'Align center')}
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={<AlignRight className="h-4 w-4" />}
          label={t('Templates.Editor.AlignRight', 'Align right')}
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          icon={<AlignJustify className="h-4 w-4" />}
          label={t('Templates.Editor.AlignJustify', 'Justify')}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists dropdown */}
        <ListDropdown editor={editor} />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={<Quote className="h-4 w-4" />}
          label={t('Templates.Editor.Blockquote', 'Quote')}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Link */}
        <ToolbarButton
          editor={editor}
          action={handleSetLink}
          isActive={editor.isActive('link')}
          icon={<LinkIcon className="h-4 w-4" />}
          label={t('Templates.Editor.Link', 'Link')}
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().unsetLink().run()}
          icon={<Unlink className="h-4 w-4" />}
          label={t('Templates.Editor.Unlink', 'Remove link')}
          disabled={!editor.isActive('link')}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Undo/Redo */}
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().undo().run()}
          icon={<Undo className="h-4 w-4" />}
          label={t('Templates.Editor.Undo', 'Undo')}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().redo().run()}
          icon={<Redo className="h-4 w-4" />}
          label={t('Templates.Editor.Redo', 'Redo')}
          disabled={!editor.can().redo()}
        />

        {/* Insert variable */}
        {templateName && (
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <InsertVariableButton
              templateName={templateName}
              onInsert={(expr) => editor.chain().focus().insertContent(expr).run()}
            />
          </>
        )}

        {/* Switch to code */}
        {onSwitchToCode && (
          <>
            <div className="flex-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs"
                  onClick={onSwitchToCode}
                  aria-label={t('Templates.Editor.ModeCode', 'Code')}
                >
                  <Code className="h-3.5 w-3.5" />
                  Code
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t('Templates.Editor.ModeCode', 'Code')}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Heading dropdown
// ---------------------------------------------------------------------------

const HEADING_OPTIONS = [
  { level: 0, label: 'Paragraph', icon: Pilcrow },
  { level: 1, label: 'Heading 1', icon: () => <span className="text-sm font-bold">H1</span> },
  { level: 2, label: 'Heading 2', icon: () => <span className="text-sm font-semibold">H2</span> },
  { level: 3, label: 'Heading 3', icon: () => <span className="text-sm font-medium">H3</span> },
  { level: 4, label: 'Heading 4', icon: () => <span className="text-xs font-medium">H4</span> },
] as const;

function HeadingDropdown({ editor }: Readonly<{ editor: Editor }>) {
  const { t } = useTranslation();

  const activeLevel = HEADING_OPTIONS.find(
    (opt) => opt.level > 0 && editor.isActive('heading', { level: opt.level })
  );

  const ActiveIcon = activeLevel?.icon ?? Pilcrow;
  const activeLabel = activeLevel
    ? t(`Templates.Editor.Heading${activeLevel.level}`, activeLevel.label)
    : t('Templates.Editor.Paragraph', 'Paragraph');

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
              ? t('Templates.Editor.Paragraph', 'Paragraph')
              : t(`Templates.Editor.Heading${opt.level}`, opt.label);

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

function ListDropdown({ editor }: Readonly<{ editor: Editor }>) {
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
          aria-label={t('Templates.Editor.Lists', 'Lists')}
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
          {t('Templates.Editor.BulletList', 'Bullet list')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn('gap-2', editor.isActive('orderedList') && 'bg-accent')}
          onSelect={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
          {t('Templates.Editor.OrderedList', 'Ordered list')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn('gap-2', editor.isActive('taskList') && 'bg-accent')}
          onSelect={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListCheck className="h-4 w-4" />
          {t('Templates.Editor.TaskList', 'Task list')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
