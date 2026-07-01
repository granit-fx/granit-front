import { screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';

import { RichTextEditor } from '../components/rich-text-editor';

import { renderWithProviders } from './test-utils';

import type { TemplateEditorHandle } from '../components/template-editor';
import type * as ReactTemplating from '@granit/react-templating';

// The generic formatting toolbar + HTML round-trip are owned (and tested) by
// @granit/react-ui-rich-text. These tests cover only what this wrapper adds: the
// templating toolbar extras (variable picker, switch-to-code) and the
// re-exposed insertAtCursor handle.

vi.mock('@granit/react-templating', async () => {
  const actual = await vi.importActual<typeof ReactTemplating>('@granit/react-templating');
  return {
    ...actual,
    useTemplateVariables: () => ({
      data: {
        globalVariables: [{ name: 'now', type: 'DateTime', description: null }],
        modelVariables: [],
        enrichedVariables: [],
      },
    }),
  };
});

// ProseMirror's scrollToSelection calls getClientRects on text nodes, which jsdom
// does not implement. Polyfill it so editor commands don't crash.
beforeAll(() => {
  const emptyRect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  } as DOMRect;
  const rectList = Object.assign([emptyRect], { item: () => emptyRect }) as unknown as DOMRectList;
  for (const proto of [Element.prototype, Range.prototype, Text.prototype]) {
    if (!('getClientRects' in proto)) {
      Object.defineProperty(proto, 'getClientRects', { value: () => rectList, configurable: true });
    }
    if (!('getBoundingClientRect' in proto)) {
      Object.defineProperty(proto, 'getBoundingClientRect', {
        value: () => emptyRect,
        configurable: true,
      });
    }
  }
});

async function renderEditor(props: Partial<React.ComponentProps<typeof RichTextEditor>> = {}) {
  const result = renderWithProviders(
    <RichTextEditor value="<p>Hello</p>" onChange={props.onChange ?? vi.fn()} {...props} />
  );
  await waitFor(() =>
    expect(result.container.querySelector('[data-slot="rich-text-editor"]')).toBeInTheDocument()
  );
  return result;
}

describe('RichTextEditor (templating wrapper)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders the shared editor with its toolbar', async () => {
    const { container } = await renderEditor();
    expect(container.querySelector('[data-slot="rich-text-toolbar"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });

  it('does not render the toolbar when readOnly', async () => {
    const { container } = await renderEditor({ readOnly: true });
    expect(container.querySelector('[data-slot="rich-text-toolbar"]')).not.toBeInTheDocument();
  });

  it('renders the insert-variable button when templateName is provided', async () => {
    await renderEditor({ templateName: 'welcome' });
    expect(screen.getByRole('button', { name: 'Insert Variable' })).toBeInTheDocument();
  });

  it('does not render the insert-variable button without a templateName', async () => {
    await renderEditor();
    expect(screen.queryByRole('button', { name: 'Insert Variable' })).not.toBeInTheDocument();
  });

  it('renders and triggers the switch-to-code control', async () => {
    const onSwitchToCode = vi.fn();
    const { user } = await renderEditor({ onSwitchToCode });
    await user.click(screen.getByRole('button', { name: 'Code' }));
    expect(onSwitchToCode).toHaveBeenCalled();
  });

  it('exposes insertAtCursor via ref', async () => {
    const ref = createRef<TemplateEditorHandle>();
    await renderEditor({ ref });
    expect(typeof ref.current?.insertAtCursor).toBe('function');
    expect(() => ref.current?.insertAtCursor('{{ now }}')).not.toThrow();
  });

  it('syncs external value updates', async () => {
    const { container, rerender } = await renderEditor();
    rerender(<RichTextEditor value="<p>Updated</p>" onChange={vi.fn()} />);
    await waitFor(() => expect(container.textContent).toContain('Updated'));
  });
});
