import { screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';

import { RichTextEditor } from '../components/rich-text-editor';

import { renderWithProviders } from './test-utils';

import type { TemplateEditorHandle } from '../components/template-editor';
import type * as ReactTemplating from '@granit/react-templating';

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
// does not implement. Polyfill it so block-level commands (alignment, lists,
// headings, blockquote) don't crash with "getClientRects is not a function".
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

describe('RichTextEditor', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('should render the editor and toolbar', async () => {
    const { container } = await renderEditor();
    expect(container.querySelector('[data-slot="rich-text-toolbar"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });

  it('should not render the toolbar when readOnly', async () => {
    const { container } = await renderEditor({ readOnly: true });
    expect(container.querySelector('[data-slot="rich-text-toolbar"]')).not.toBeInTheDocument();
  });

  it('should call onChange when a formatting command runs', async () => {
    const onChange = vi.fn();
    const { user } = await renderEditor({ onChange });
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it.each([
    'Italic',
    'Underline',
    'Strikethrough',
    'Align Left',
    'Align Center',
    'Align Right',
    'Justify',
    'Blockquote',
  ])('should run the %s toolbar action without crashing', async (label) => {
    const { user } = await renderEditor();
    await user.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('should set a link via the prompt', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('https://granit.dev'));
    const onChange = vi.fn();
    const { user } = await renderEditor({ onChange });
    await user.click(screen.getByRole('button', { name: 'Link' }));
    expect(globalThis.prompt).toHaveBeenCalled();
  });

  it('should cancel link insertion when the prompt is dismissed', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValue(null));
    const { user } = await renderEditor();
    await user.click(screen.getByRole('button', { name: 'Link' }));
    expect(globalThis.prompt).toHaveBeenCalled();
  });

  it('should remove a link when the prompt returns an empty string', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValue(''));
    const { user } = await renderEditor();
    await user.click(screen.getByRole('button', { name: 'Link' }));
    expect(globalThis.prompt).toHaveBeenCalled();
  });

  it('should open the heading dropdown and pick a heading', async () => {
    const onChange = vi.fn();
    const { user } = await renderEditor({ onChange });
    await user.click(screen.getByRole('button', { name: 'Paragraph' }));
    await user.click(await screen.findByText('Heading 1'));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it('should open the heading dropdown and reset to paragraph', async () => {
    const { user } = await renderEditor();
    await user.click(screen.getByRole('button', { name: 'Paragraph' }));
    const items = await screen.findAllByText('Paragraph');
    await user.click(items[items.length - 1]!);
  });

  it('should open the lists dropdown and toggle list types', async () => {
    const { user } = await renderEditor();
    await user.click(screen.getByRole('button', { name: 'Lists' }));
    await user.click(await screen.findByText('Bullet List'));
    await user.click(screen.getByRole('button', { name: 'Lists' }));
    await user.click(await screen.findByText('Ordered List'));
    await user.click(screen.getByRole('button', { name: 'Lists' }));
    await user.click(await screen.findByText('Task List'));
  });

  it('should render the insert-variable button when templateName is provided', async () => {
    await renderEditor({ templateName: 'welcome' });
    expect(screen.getByRole('button', { name: 'Insert Variable' })).toBeInTheDocument();
  });

  it('should render and trigger the switch-to-code control', async () => {
    const onSwitchToCode = vi.fn();
    const { user } = await renderEditor({ onSwitchToCode });
    await user.click(screen.getByRole('button', { name: 'Code' }));
    expect(onSwitchToCode).toHaveBeenCalled();
  });

  it('should expose insertAtCursor via ref', async () => {
    const ref = createRef<TemplateEditorHandle>();
    await renderEditor({ ref });
    expect(typeof ref.current?.insertAtCursor).toBe('function');
    expect(() => ref.current?.insertAtCursor('{{ now }}')).not.toThrow();
  });

  it('should sync external value updates', async () => {
    const { container, rerender } = await renderEditor();
    rerender(<RichTextEditor value="<p>Updated</p>" onChange={vi.fn()} />);
    await waitFor(() => expect(container.textContent).toContain('Updated'));
  });
});
