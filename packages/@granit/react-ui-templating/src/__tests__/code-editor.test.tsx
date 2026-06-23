import { act, waitFor } from '@testing-library/react';
import { createRef } from 'react';

import { CodeEditor } from '../components/code-editor';

import { renderWithProviders } from './test-utils';

import type { TemplateEditorHandle } from '../components/template-editor';

describe('CodeEditor', () => {
  it('should mount the CodeMirror container with the initial value', async () => {
    const { container } = renderWithProviders(<CodeEditor value="<p>hi</p>" onChange={vi.fn()} />);
    await waitFor(() =>
      expect(container.querySelector('[data-slot="code-editor"]')).toBeInTheDocument()
    );
    expect(container.querySelector('.cm-editor')).toBeInTheDocument();
    expect(container.textContent).toContain('hi');
  });

  it('should fire onChange when the document changes via insertAtCursor', async () => {
    const onChange = vi.fn();
    const ref = createRef<TemplateEditorHandle>();
    renderWithProviders(<CodeEditor ref={ref} value="abc" onChange={onChange} />);
    await waitFor(() => expect(ref.current).toBeTruthy());
    act(() => ref.current?.insertAtCursor('XYZ'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.stringContaining('XYZ')));
  });

  it('should sync external value changes into the editor', async () => {
    const { container, rerender } = renderWithProviders(
      <CodeEditor value="first" onChange={vi.fn()} />
    );
    await waitFor(() => expect(container.textContent).toContain('first'));
    rerender(<CodeEditor value="second" onChange={vi.fn()} />);
    await waitFor(() => expect(container.textContent).toContain('second'));
  });

  it('should be read-only when readOnly is set', async () => {
    const { container } = renderWithProviders(
      <CodeEditor value="locked" onChange={vi.fn()} readOnly />
    );
    await waitFor(() => expect(container.querySelector('.cm-editor')).toBeInTheDocument());
    const content = container.querySelector('.cm-content');
    expect(content?.getAttribute('contenteditable')).toBe('false');
  });

  it('should no-op insertAtCursor before the view is ready (defensive)', () => {
    const ref = createRef<TemplateEditorHandle>();
    renderWithProviders(<CodeEditor ref={ref} value="x" onChange={vi.fn()} />);
    // Calling immediately should not throw even if invoked twice.
    expect(() => ref.current?.insertAtCursor('a')).not.toThrow();
  });
});
