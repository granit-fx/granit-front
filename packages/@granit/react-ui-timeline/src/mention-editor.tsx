import { cn } from '@granit/utils';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, ReactRenderer, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import tippy, { type Instance, type Props as TippyProps } from 'tippy.js';

import type { MentionSuggestion } from '@granit/timeline';

import 'tippy.js/dist/tippy.css';

// Same canonical wire format the backend's `MentionParser` consumes and
// the timeline body renderer parses for `<Link>` chips:
// `@[Display Name](user:<guid>)`.
const MENTION_REGEX =
  /@\[([^\]]+)\]\(user:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)/g;

interface MentionInlineNode {
  readonly type: 'text' | 'mention';
  readonly text?: string;
  readonly attrs?: { readonly id: string; readonly label: string };
}

interface MentionParagraphNode {
  readonly type: 'paragraph';
  // TipTap's `Content` type requires mutable arrays; this doc is built locally
  // and handed straight to useEditor, so the immutability would only block the
  // call site without giving us a real guarantee.
  content?: MentionInlineNode[];
}

interface MentionDoc {
  readonly type: 'doc';
  content: MentionParagraphNode[];
}

// Parse one logical line of markdown into ProseMirror inline nodes.
// Plain segments become `text`; every `@[Name](user:guid)` match becomes
// a `mention` atom. Everything outside the regex is preserved verbatim.
function parseInline(line: string): MentionInlineNode[] {
  const result: MentionInlineNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', text: line.slice(lastIndex, match.index) });
    }
    result.push({ type: 'mention', attrs: { id: match[2] ?? '', label: match[1] ?? '' } });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    result.push({ type: 'text', text: line.slice(lastIndex) });
  }
  return result;
}

// Initial seed: turn the markdown body into a ProseMirror JSON doc the
// editor can hydrate from. Each `\n` becomes a fresh paragraph; mentions
// are materialised as atomic `mention` nodes so the editor treats them
// as a single deletable chip.
function markdownToDoc(markdown: string): MentionDoc {
  if (!markdown) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }
  const paragraphs = markdown.split('\n').map<MentionParagraphNode>((line) => {
    const inline = parseInline(line);
    return inline.length > 0 ? { type: 'paragraph', content: inline } : { type: 'paragraph' };
  });
  return { type: 'doc', content: paragraphs };
}

// Reverse pass: serialise the editor's current document back to the
// markdown shape the backend expects. Mention chips re-emerge as
// `@[label](user:id)` so the wire format is round-trip stable.
function docToMarkdown(editor: Editor): string {
  const json = editor.getJSON() as MentionDoc;
  const lines: string[] = [];
  for (const block of json.content ?? []) {
    if (block.type !== 'paragraph') continue;
    const parts: string[] = [];
    for (const node of block.content ?? []) {
      if (node.type === 'text') {
        parts.push(node.text ?? '');
      } else if (node.type === 'mention' && node.attrs) {
        parts.push(`@[${node.attrs.label}](user:${node.attrs.id})`);
      }
    }
    lines.push(parts.join(''));
  }
  return lines.join('\n');
}

interface MentionListItemRef {
  readonly onKeyDown: (event: KeyboardEvent) => boolean;
}

interface MentionListProps {
  readonly items: readonly MentionSuggestion[];
  readonly command: (item: { id: string; label: string }) => void;
}

const MentionList = forwardRef<MentionListItemRef, MentionListProps>(function MentionList(
  { items, command },
  ref
) {
  // Track previous items via a state pair so we can reset the highlight
  // on identity change without writing to a ref during render (lint
  // forbids that) and without an effect (cascading renders).
  const [prevItems, setPrevItems] = useState(items);
  const [selectedIndex, setSelectedIndex] = useState(0);
  if (prevItems !== items) {
    setPrevItems(items);
    setSelectedIndex(0);
  }

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command({ id: item.id, label: item.displayName });
  };

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event: KeyboardEvent): boolean => {
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }),
    // selectItem closes over the latest selectedIndex/items via state.
    [items, selectedIndex]
  );

  if (items.length === 0) return null;

  // Each row is a real <button> so it's natively interactive (the
  // browser routes Enter/Space to the click handler and a11y tooling
  // recognises it without ARIA roles). The TipTap suggestion plugin
  // still owns arrow-key navigation while focus stays in the editor
  // (see `onKeyDown` plumbing in the suggestion render() above); the
  // click path is just the pointer fallback.
  return (
    <ul
      data-slot="mention-editor"
      data-testid="mention-editor-listbox"
      className="max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover py-1 text-sm text-popover-foreground shadow-md"
    >
      {items.map((item, index) => {
        const active = index === selectedIndex;
        return (
          <li key={item.id}>
            <button
              type="button"
              data-testid="mention-editor-option"
              data-active={active ? '' : undefined}
              aria-pressed={active}
              // `mousedown` preventDefault keeps focus in the editor —
              // letting it shift to the popup would tear down the
              // suggestion plugin before the click completes.
              // The actual selection runs on `click` so the user's
              // mouse-up still has somewhere to land.
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                selectItem(index);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                'block w-full cursor-pointer truncate px-3 py-1.5 text-left',
                active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
              )}
            >
              {item.displayName}
            </button>
          </li>
        );
      })}
    </ul>
  );
});

export interface MentionEditorProps {
  /** Markdown body — only consumed on mount. */
  readonly initialBody?: string;
  /** Fires on every keystroke with the markdown-serialised body. */
  readonly onChange: (markdown: string) => void;
  /** Async source for `@`-mention suggestions. Disabling = no autocomplete. */
  readonly searchMentions?: (query: string) => Promise<MentionSuggestion[]>;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  /** Optional Enter handler (Shift+Enter still adds a paragraph break). */
  readonly onSubmit?: () => void;
  readonly className?: string;
}

// TipTap-backed composer surface. Renders mentions as atomic chips
// (deletable as one unit) and gets a Tippy-driven suggestion popup
// anchored at the caret. Output is round-trip-stable with the
// `@[Name](user:guid)` markdown the backend stores.
export function MentionEditor({
  initialBody = '',
  onChange,
  searchMentions,
  placeholder,
  disabled = false,
  onSubmit,
  className,
}: MentionEditorProps) {
  // Tracks whether the mention suggestion popup is currently mounted.
  // We can't query the DOM reliably (Tippy keeps a hidden root between
  // shows, and the listbox is empty while items are loading), so we
  // hook the suggestion lifecycle directly.
  const popupOpenRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Strip features the timeline body doesn't carry over the wire:
        // anything beyond text + mention + paragraph breaks would silently
        // be lost during markdown serialisation.
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      Mention.configure({
        HTMLAttributes: {
          class:
            'inline-flex items-center rounded px-1 py-0.5 font-medium text-primary bg-primary/10',
          'data-testid': 'mention-editor-chip',
        },
        renderText({ node }) {
          // What we copy/paste; the on-screen chip uses HTMLAttributes.
          return `@${node.attrs.label}`;
        },
        suggestion: {
          char: '@',
          // Empty query is forwarded so the popup opens immediately on `@`.
          items: async ({ query }) => {
            if (!searchMentions) return [];
            return await searchMentions(query);
          },
          render: () => {
            let component: ReactRenderer<MentionListItemRef, MentionListProps>;
            let popup: Instance<TippyProps>[];

            return {
              onStart: (props) => {
                popupOpenRef.current = true;
                component = new ReactRenderer(MentionList, {
                  props: {
                    items: props.items as readonly MentionSuggestion[],
                    command: props.command,
                  },
                  editor: props.editor,
                });
                if (!props.clientRect) return;
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                  // Strip Tippy's default theme — we ship our own styling
                  // on the listbox so it inherits design tokens.
                  arrow: false,
                  offset: [0, 4],
                });
              },
              onUpdate(props) {
                component.updateProps({
                  items: props.items as readonly MentionSuggestion[],
                  command: props.command,
                });
                // Guard: `onUpdate` can race with `onExit` (e.g. when
                // the user clears the trigger char by deleting); calling
                // `setProps` on a destroyed Tippy instance prints a
                // "memory leak" warning in dev.
                if (!props.clientRect) return;
                const instance = popup?.[0];
                if (!instance || instance.state.isDestroyed) return;
                instance.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  const instance = popup?.[0];
                  if (instance && !instance.state.isDestroyed) instance.hide();
                  return true;
                }
                return component.ref?.onKeyDown(props.event) ?? false;
              },
              onExit() {
                popupOpenRef.current = false;
                const instance = popup?.[0];
                if (instance && !instance.state.isDestroyed) instance.destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: markdownToDoc(initialBody),
    editable: !disabled,
    // Defer creation under React 19 StrictMode (double-invocation would
    // otherwise leave a destroyed editor instance behind).
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(docToMarkdown(ed));
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(!disabled);
  }, [editor, disabled]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && onSubmit) {
      // While the mention popup is open, Enter belongs to it (selects
      // the highlighted suggestion via the plugin's own keydown). We
      // stopPropagation as well so the outer form's submit handler
      // never sees a synthetic Enter on a focused button or input.
      if (popupOpenRef.current) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <EditorContent
      editor={editor}
      onKeyDown={handleKeyDown}
      data-testid="mention-editor"
      className={cn(
        'min-h-[5rem] w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm',
        // Style the editable surface itself (TipTap renders into a child div).
        '[&_.ProseMirror]:min-h-[4rem] [&_.ProseMirror]:outline-none',
        // Placeholder text (the empty-doc decoration injected by the extension).
        '[&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none',
        '[&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left',
        '[&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0',
        '[&_.ProseMirror_p.is-editor-empty:first-child]:before:text-muted-foreground',
        '[&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
        className
      )}
    />
  );
}
