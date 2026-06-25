import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { createRef } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';

import { richTextTranslationsEn } from '../locales';
import { RichTextEditor, type RichTextEditorHandle } from '../rich-text-editor';

import type { ReactNode } from 'react';

const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...richTextTranslationsEn } } },
  interpolation: { escapeValue: false },
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

function renderEditor(props: Partial<React.ComponentProps<typeof RichTextEditor>> = {}) {
  const user = userEvent.setup();
  const result = render(
    <RichTextEditor value="<p>Hello</p>" onChange={props.onChange ?? vi.fn()} {...props} />,
    {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
      ),
    }
  );
  return { ...result, user };
}

async function renderReady(props: Partial<React.ComponentProps<typeof RichTextEditor>> = {}) {
  const result = renderEditor(props);
  await waitFor(() =>
    expect(result.container.querySelector('[data-slot="rich-text-editor"]')).toBeInTheDocument()
  );
  return result;
}

describe('RichTextEditor', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders the editor and toolbar', async () => {
    const { container } = await renderReady();
    expect(container.querySelector('[data-slot="rich-text-toolbar"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });

  it('hides the toolbar when readOnly', async () => {
    const { container } = await renderReady({ readOnly: true });
    expect(container.querySelector('[data-slot="rich-text-toolbar"]')).not.toBeInTheDocument();
  });

  it('calls onChange when a formatting command runs', async () => {
    const onChange = vi.fn();
    const { user } = await renderReady({ onChange });
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it.each(['Italic', 'Underline', 'Strikethrough', 'Align left', 'Align center', 'Quote'])(
    'runs the %s toolbar action without crashing',
    async (label) => {
      const { user } = await renderReady();
      await user.click(screen.getByRole('button', { name: label }));
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  );

  it('sets a link via the prompt', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('https://granit.dev'));
    const { user } = await renderReady();
    await user.click(screen.getByRole('button', { name: 'Link' }));
    expect(globalThis.prompt).toHaveBeenCalled();
  });

  it('opens the heading dropdown and picks a heading', async () => {
    const onChange = vi.fn();
    const { user } = await renderReady({ onChange });
    await user.click(screen.getByRole('button', { name: 'Paragraph' }));
    await user.click(await screen.findByText('Heading 1'));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it('opens the lists dropdown and toggles a list type', async () => {
    const { user } = await renderReady();
    await user.click(screen.getByRole('button', { name: 'Lists' }));
    await user.click(await screen.findByText('Bullet list'));
  });

  it('renders host-provided toolbarExtras', async () => {
    await renderReady({ toolbarExtras: <button type="button">Insert variable</button> });
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeInTheDocument();
  });

  it('exposes insertAtCursor via ref', async () => {
    const ref = createRef<RichTextEditorHandle>();
    await renderReady({ ref });
    expect(typeof ref.current?.insertAtCursor).toBe('function');
    expect(() => ref.current?.insertAtCursor('{{ now }}')).not.toThrow();
  });

  it('syncs external value updates', async () => {
    const { container, rerender } = await renderReady();
    rerender(<RichTextEditor value="<p>Updated</p>" onChange={vi.fn()} />);
    await waitFor(() => expect(container.textContent).toContain('Updated'));
  });
});
