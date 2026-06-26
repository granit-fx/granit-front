import { cn } from '@granit/utils';
import { Extension, type Editor, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  Pilcrow,
  Quote,
} from 'lucide-react';
import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import tippy, { type Instance, type Props as TippyProps } from 'tippy.js';

// NOTE: tippy's theme CSS is intentionally NOT imported here — the popup ships
// its own styled listbox and tippy positions via inline styles, so the default
// theme isn't needed. Importing `tippy.js/dist/tippy.css` from this source would
// also leak an un-typed side-effect import into every consumer's tsc program.

type LucideIcon = ComponentType<{ readonly className?: string }>;
type TFunction = (key: string, options: { readonly defaultValue: string }) => string;

/** One entry in the slash (`/`) command menu. */
export interface SlashCommandItem {
  readonly title: string;
  readonly icon: ReactNode;
  /** Runs the block action; receives the range of the typed `/query` to delete. */
  readonly command: (props: { readonly editor: Editor; readonly range: Range }) => void;
}

interface SlashItemSpec {
  readonly key: string;
  readonly fallback: string;
  readonly icon: LucideIcon;
  readonly run: (editor: Editor, range: Range) => void;
}

// The framework's built-in blocks. Apps can build their own list and pass it via
// `SlashCommand.configure({ items })` to add domain blocks.
const SLASH_ITEM_SPECS: readonly SlashItemSpec[] = [
  {
    key: 'RichText.Slash.Paragraph',
    fallback: 'Text',
    icon: Pilcrow,
    run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    key: 'RichText.Slash.Heading1',
    fallback: 'Heading 1',
    icon: Heading1,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    key: 'RichText.Slash.Heading2',
    fallback: 'Heading 2',
    icon: Heading2,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    key: 'RichText.Slash.Heading3',
    fallback: 'Heading 3',
    icon: Heading3,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    key: 'RichText.Slash.BulletList',
    fallback: 'Bullet list',
    icon: List,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    key: 'RichText.Slash.OrderedList',
    fallback: 'Ordered list',
    icon: ListOrdered,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    key: 'RichText.Slash.TaskList',
    fallback: 'Task list',
    icon: ListChecks,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    key: 'RichText.Slash.Quote',
    fallback: 'Quote',
    icon: Quote,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    key: 'RichText.Slash.CodeBlock',
    fallback: 'Code block',
    icon: Code2,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
];

/** Builds the framework's default slash items, localized via `t`. */
export function createDefaultSlashItems(t: TFunction): readonly SlashCommandItem[] {
  return SLASH_ITEM_SPECS.map((spec) => {
    const Icon = spec.icon;
    return {
      title: t(spec.key, { defaultValue: spec.fallback }),
      icon: <Icon className="h-4 w-4" />,
      command: ({ editor, range }) => spec.run(editor, range),
    };
  });
}

interface SlashListRef {
  readonly onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SlashListProps {
  readonly items: readonly SlashCommandItem[];
  readonly command: (item: SlashCommandItem) => void;
}

const SlashCommandList = forwardRef<SlashListRef, SlashListProps>(function SlashCommandList(
  { items, command },
  ref
) {
  const [prevItems, setPrevItems] = useState(items);
  const [selectedIndex, setSelectedIndex] = useState(0);
  if (prevItems !== items) {
    setPrevItems(items);
    setSelectedIndex(0);
  }

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
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
    [items, selectedIndex]
  );

  if (items.length === 0) return null;

  return (
    <ul
      data-slot="rich-text-slash-menu"
      className="max-h-72 w-60 overflow-auto rounded-md border border-border bg-popover py-1 text-sm text-popover-foreground shadow-md"
    >
      {items.map((item, index) => {
        const active = index === selectedIndex;
        return (
          <li key={item.title}>
            <button
              type="button"
              data-slot="rich-text-slash-item"
              data-active={active ? '' : undefined}
              aria-pressed={active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                selectItem(index);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left',
                active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
              )}
            >
              <span className="text-muted-foreground">{item.icon}</span>
              {item.title}
            </button>
          </li>
        );
      })}
    </ul>
  );
});

export interface SlashCommandOptions {
  /** Returns the items to show for the current `/query` (already filtered). */
  readonly items: (query: string) => readonly SlashCommandItem[];
}

/**
 * TipTap extension adding a Notion-style `/` block menu. Mirrors the proven
 * Suggestion + {@link ReactRenderer} + tippy plumbing used by the timeline
 * mention editor. Configure with an `items` provider:
 *
 *     SlashCommand.configure({
 *       items: (query) => createDefaultSlashItems(t).filter((i) =>
 *         i.title.toLowerCase().includes(query.toLowerCase())),
 *     })
 */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return { items: () => [] };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        allowSpaces: false,
        startOfLine: false,
        command: ({ editor, range, props }) => props.command({ editor, range }),
        items: ({ query }) => [...this.options.items(query)],
        render: () => {
          let component: ReactRenderer<SlashListRef, SlashListProps>;
          let popup: Instance<TippyProps>[];

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props: { items: props.items, command: props.command },
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
                arrow: false,
                offset: [0, 4],
              });
            },
            onUpdate(props) {
              component.updateProps({ items: props.items, command: props.command });
              if (!props.clientRect) return;
              const instance = popup?.[0];
              if (!instance || instance.state.isDestroyed) return;
              instance.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
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
              const instance = popup?.[0];
              if (instance && !instance.state.isDestroyed) instance.destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
