import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { MentionEditor } from './mention-editor';

import type { MentionSuggestion } from '@granit/timeline';

// ---------------------------------------------------------------------------
// jsdom polyfills for ProseMirror / Tippy geometry.
// ProseMirror measures the caret (coordsAtPos → getClientRects) on selection
// changes, and Tippy positions the popup against document.body's bounding box.
// jsdom implements no layout, so both APIs are missing on some targets; stub
// them so the suggestion lifecycle can run without throwing.
// ---------------------------------------------------------------------------
const ZERO_RECT: DOMRect = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
};
const EMPTY_RECTS = { length: 0, item: () => null } as unknown as DOMRectList;

function installGeometryPolyfills() {
  for (const proto of [Element.prototype, Range.prototype]) {
    const target = proto as unknown as {
      getClientRects?: () => DOMRectList;
      getBoundingClientRect?: () => DOMRect;
    };
    target.getClientRects = () => EMPTY_RECTS;
    target.getBoundingClientRect = () => ZERO_RECT;
  }

  // ProseMirror re-anchors the DOM selection after a mention insert; with no
  // layout, jsdom's Selection throws "There is no selection to collapse". These
  // calls are display-only in tests, so swallow the layout-driven failures.
  const selectionProto = (globalThis as { Selection?: { prototype: object } }).Selection?.prototype;
  if (selectionProto) {
    const guarded = ['collapse', 'collapseToEnd', 'collapseToStart', 'extend', 'setBaseAndExtent'];
    const methods = selectionProto as Record<string, (...args: unknown[]) => unknown>;
    for (const name of guarded) {
      const original = methods[name];
      if (typeof original !== 'function') continue;
      methods[name] = function patched(this: unknown, ...args: unknown[]): unknown {
        try {
          return original.apply(this, args);
        } catch {
          return undefined;
        }
      };
    }
  }
}

const BOB_ID = '8c6b1e10-0000-4000-8000-000000000001';
const ALICE_ID = '8c6b1e10-0000-4000-8000-000000000002';

const SUGGESTIONS: readonly MentionSuggestion[] = [
  { id: BOB_ID, displayName: 'Bob' },
  { id: ALICE_ID, displayName: 'Alice' },
];

function pasteText(pm: HTMLElement, text: string) {
  const clipboardData = {
    getData: (type: string) => (type === 'text/plain' ? text : ''),
    types: ['text/plain'],
    files: [],
    items: [],
  };
  fireEvent.paste(pm, { clipboardData });
}

async function mount(props: Partial<Parameters<typeof MentionEditor>[0]> = {}) {
  const onChange = props.onChange ?? vi.fn();
  const result = render(<MentionEditor onChange={onChange} {...props} />);
  await waitFor(() => expect(result.container.querySelector('.ProseMirror')).not.toBeNull());
  const pm = result.container.querySelector('.ProseMirror') as HTMLElement;
  return { ...result, pm, onChange };
}

function tick(ms = 60) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeAll(() => {
  installGeometryPolyfills();
});

afterEach(() => {
  // Tippy appends the suggestion popup to document.body outside the RTL
  // container; clear it so popups do not leak between tests.
  document.querySelectorAll('[data-tippy-root]').forEach((el) => el.remove());
});

describe('MentionEditor', () => {
  it('renders the editable surface with the merged className', async () => {
    const { container } = await mount({ className: 'custom-surface' });
    const root = container.querySelector('[data-testid="mention-editor"]') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.className).toContain('custom-surface');
    expect(container.querySelector('.ProseMirror')?.getAttribute('contenteditable')).toBe('true');
  });

  it('seeds a multi-line body into one paragraph per line, dropping empty lines to bare paragraphs', async () => {
    const { pm } = await mount({ initialBody: 'first\n\nthird' });
    const paragraphs = pm.querySelectorAll('p');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]?.textContent).toBe('first');
    // Middle line was empty → paragraph with no inline content.
    expect(paragraphs[1]?.textContent).toBe('');
    expect(paragraphs[2]?.textContent).toBe('third');
  });

  it('materialises a mention chip with surrounding text from the seeded markdown', async () => {
    const { pm } = await mount({ initialBody: `Hi @[Bob](user:${BOB_ID}) there` });
    const chip = pm.querySelector('[data-testid="mention-editor-chip"]');
    expect(chip).not.toBeNull();
    expect(chip?.textContent).toContain('Bob');
    expect(pm.textContent).toContain('Hi');
    expect(pm.textContent).toContain('there');
  });

  it('materialises a mention chip when the mention is the first token (no leading text)', async () => {
    const { pm } = await mount({ initialBody: `@[Alice](user:${ALICE_ID}) hello` });
    const chips = pm.querySelectorAll('[data-testid="mention-editor-chip"]');
    expect(chips).toHaveLength(1);
    expect(chips[0]?.textContent).toContain('Alice');
  });

  it('exposes the placeholder as the empty-doc decoration attribute', async () => {
    const { pm } = await mount({ placeholder: 'Write a note…' });
    const emptyParagraph = pm.querySelector('p');
    expect(emptyParagraph?.getAttribute('data-placeholder')).toBe('Write a note…');
  });

  it('renders a non-editable surface when disabled and re-enables it on prop change', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <MentionEditor onChange={onChange} disabled initialBody="locked" />
    );
    await waitFor(() => expect(container.querySelector('.ProseMirror')).not.toBeNull());
    expect(container.querySelector('.ProseMirror')?.getAttribute('contenteditable')).toBe('false');

    rerender(<MentionEditor onChange={onChange} disabled={false} initialBody="locked" />);
    await waitFor(() =>
      expect(container.querySelector('.ProseMirror')?.getAttribute('contenteditable')).toBe('true')
    );
  });

  it('serialises the document back to markdown on edit via onChange', async () => {
    const { pm, onChange } = await mount({ initialBody: 'world' });
    pasteText(pm, 'hello ');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls.at(-1)?.[0]).toBe('hello world');
  });

  it('round-trips a mention chip through markdown serialisation on edit', async () => {
    const { pm, onChange } = await mount({ initialBody: `@[Bob](user:${BOB_ID})` });
    pasteText(pm, 'X ');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(`X @[Bob](user:${BOB_ID})`);
  });

  it('submits on Enter, ignores Shift+Enter, and is inert without an onSubmit handler', async () => {
    const onSubmit = vi.fn();
    const { pm, rerender, container } = await mount({ onSubmit, initialBody: 'x' });

    fireEvent.keyDown(pm, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(pm, { key: 'Enter', shiftKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // A non-Enter key never reaches the submit branch.
    fireEvent.keyDown(pm, { key: 'a' });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Without onSubmit, Enter is a no-op (no throw).
    const onChange = vi.fn();
    rerender(<MentionEditor onChange={onChange} initialBody="x" />);
    const pm2 = container.querySelector('.ProseMirror') as HTMLElement;
    expect(() => fireEvent.keyDown(pm2, { key: 'Enter' })).not.toThrow();
  });

  it('opens the mention popup on "@" and lists suggestions from searchMentions', async () => {
    const searchMentions = vi.fn(async () => [...SUGGESTIONS]);
    const { pm } = await mount({ searchMentions });
    pasteText(pm, '@Bob');
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mention-editor-listbox"]')).not.toBeNull()
    );
    expect(searchMentions).toHaveBeenCalled();
    const options = document.querySelectorAll('[data-testid="mention-editor-option"]');
    expect(options).toHaveLength(2);
    // First option is active by default.
    expect(options[0]?.getAttribute('data-active')).toBe('');
    expect(options[1]?.hasAttribute('data-active')).toBe(false);
  });

  it('opens the popup but lists nothing when no searchMentions source is wired', async () => {
    const { pm } = await mount({});
    pasteText(pm, '@Bob');
    await tick();
    // items resolve to [] → MentionList renders null, so no listbox appears.
    expect(document.querySelector('[data-testid="mention-editor-option"]')).toBeNull();
  });

  it('inserts a mention chip when an option is clicked', async () => {
    const searchMentions = vi.fn(async () => [...SUGGESTIONS]);
    const { pm, onChange } = await mount({ searchMentions });
    pasteText(pm, '@');
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mention-editor-option"]')).not.toBeNull()
    );
    const secondOption = document.querySelectorAll(
      '[data-testid="mention-editor-option"]'
    )[1] as HTMLButtonElement;
    // Hover moves the active highlight (onMouseEnter → setSelectedIndex).
    fireEvent.mouseEnter(secondOption);
    fireEvent.mouseDown(secondOption);
    fireEvent.click(secondOption);
    await waitFor(() =>
      expect(pm.querySelector('[data-testid="mention-editor-chip"]')).not.toBeNull()
    );
    expect(onChange.mock.calls.at(-1)?.[0]).toContain(`@[Alice](user:${ALICE_ID})`);
  });

  it('navigates options with arrow keys and selects the highlighted one on Enter', async () => {
    const searchMentions = vi.fn(async () => [...SUGGESTIONS]);
    const { pm, onChange } = await mount({ searchMentions });
    pasteText(pm, '@');
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mention-editor-option"]')).not.toBeNull()
    );

    // A key the listbox does not handle is delegated back to ProseMirror.
    fireEvent.keyDown(pm, { key: 'ArrowLeft' });

    // ArrowDown wraps the highlight to the second option.
    fireEvent.keyDown(pm, { key: 'ArrowDown' });
    await waitFor(() => {
      const opts = document.querySelectorAll('[data-testid="mention-editor-option"]');
      expect(opts[1]?.getAttribute('data-active')).toBe('');
    });

    // ArrowUp returns it to the first option.
    fireEvent.keyDown(pm, { key: 'ArrowUp' });
    await waitFor(() => {
      const opts = document.querySelectorAll('[data-testid="mention-editor-option"]');
      expect(opts[0]?.getAttribute('data-active')).toBe('');
    });

    // Enter (while the popup owns it) selects the highlighted suggestion.
    fireEvent.keyDown(pm, { key: 'Enter' });
    await waitFor(() =>
      expect(pm.querySelector('[data-testid="mention-editor-chip"]')).not.toBeNull()
    );
    expect(onChange.mock.calls.at(-1)?.[0]).toContain(`@[Bob](user:${BOB_ID})`);
  });

  it('swallows Enter (no submit) while the mention popup is open with nothing to select', async () => {
    // Empty suggestion source: the popup is active (so Enter belongs to it) but
    // the listbox has no item to select, exercising the popup-open guard in the
    // editor's own key handler rather than the submit path.
    const searchMentions = vi.fn(async (): Promise<MentionSuggestion[]> => []);
    const onSubmit = vi.fn();
    const { pm } = await mount({ searchMentions, onSubmit });
    pasteText(pm, '@zzz');
    await waitFor(() => expect(searchMentions).toHaveBeenCalled());
    await tick();
    fireEvent.keyDown(pm, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('closes the popup on Escape without inserting a mention', async () => {
    const searchMentions = vi.fn(async () => [...SUGGESTIONS]);
    const { pm } = await mount({ searchMentions });
    pasteText(pm, '@Bob');
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mention-editor-listbox"]')).not.toBeNull()
    );
    fireEvent.keyDown(pm, { key: 'Escape' });
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mention-editor-listbox"]')).toBeNull()
    );
    expect(pm.querySelector('[data-testid="mention-editor-chip"]')).toBeNull();
  });

  it('re-queries the source as the mention query grows (popup onUpdate)', async () => {
    const searchMentions = vi.fn(async () => [...SUGGESTIONS]);
    const { pm } = await mount({ searchMentions });
    pasteText(pm, '@Bo');
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mention-editor-listbox"]')).not.toBeNull()
    );
    const callsAfterOpen = searchMentions.mock.calls.length;
    pasteText(pm, 'b');
    await waitFor(() => expect(searchMentions.mock.calls.length).toBeGreaterThan(callsAfterOpen));
  });

  it('serialises an empty interior paragraph on edit (block with no inline content)', async () => {
    // The middle line is blank → its ProseMirror paragraph carries no `content`
    // array, exercising the `block.content ?? []` fallback in docToMarkdown.
    const { pm, onChange } = await mount({ initialBody: 'a\n\nb' });
    pasteText(pm, 'X');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last).toContain('\n\n');
    expect(last).toContain('b');
  });

  it('destroys the suggestion popup when the editor unmounts while it is open', async () => {
    // Unmounting tears down the editor → the suggestion plugin runs its
    // `destroy()` → our `onExit` fires with a live (non-destroyed) Tippy
    // instance, so the `instance.destroy()` branch is taken.
    const searchMentions = vi.fn(async () => [...SUGGESTIONS]);
    const { pm, unmount } = await mount({ searchMentions });
    pasteText(pm, '@Bob');
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mention-editor-listbox"]')).not.toBeNull()
    );
    expect(() => unmount()).not.toThrow();
  });

  it('no-ops popup update and Escape once the Tippy instance is already destroyed', async () => {
    // Force the popup instance to be destroyed out from under the editor, then
    // drive both an onUpdate (query grows) and an Escape keypress. Both guard
    // clauses that check `instance.state.isDestroyed` must short-circuit.
    const searchMentions = vi.fn(async () => [...SUGGESTIONS]);
    const { pm } = await mount({ searchMentions });
    pasteText(pm, '@Bob');
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mention-editor-listbox"]')).not.toBeNull()
    );
    const body = document.body as HTMLElement & {
      _tippy?: { destroy: () => void; state: { isDestroyed: boolean } };
    };
    const instance = body._tippy;
    expect(instance).toBeDefined();
    instance?.destroy();
    expect(instance?.state.isDestroyed).toBe(true);

    // onUpdate path: growing the query re-runs the plugin update; the destroyed
    // instance guard returns before `setProps` would throw.
    expect(() => pasteText(pm, 'b')).not.toThrow();
    await tick();

    // onKeyDown Escape path: destroyed instance → the `hide()` branch is skipped.
    expect(() => fireEvent.keyDown(pm, { key: 'Escape' })).not.toThrow();
  });
});
