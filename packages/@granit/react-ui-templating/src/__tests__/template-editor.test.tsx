import { screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';

import { TemplateEditor } from '../components/template-editor';

import { renderWithProviders } from './test-utils';

import type { TemplateEditorHandle } from '../components/template-editor';

describe('TemplateEditor', () => {
  describe('code editor mode (plain text)', () => {
    it('should render the code editor for text/plain', async () => {
      const { container } = renderWithProviders(
        <TemplateEditor value="hello" onChange={vi.fn()} mimeType="text/plain" />
      );
      await waitFor(
        () => expect(container.querySelector('[data-slot="code-editor"]')).toBeInTheDocument(),
        { timeout: 5000 }
      );
    });

    it('should expose insertAtCursor via ref', async () => {
      const ref = createRef<TemplateEditorHandle>();
      renderWithProviders(
        <TemplateEditor ref={ref} value="hello world" onChange={vi.fn()} mimeType="text/plain" />
      );
      await waitFor(() => expect(ref.current).toBeDefined());
      expect(typeof ref.current?.insertAtCursor).toBe('function');
    });
  });

  describe('rich text mode (HTML)', () => {
    it('should render the WYSIWYG editor by default with Code button in toolbar', async () => {
      const { container } = renderWithProviders(
        <TemplateEditor value="<p>Hello</p>" onChange={vi.fn()} mimeType="text/html" />
      );
      await waitFor(
        () => {
          expect(container.querySelector('[data-slot="template-editor"]')).toBeInTheDocument();
          expect(container.querySelector('[data-slot="rich-text-editor"]')).toBeInTheDocument();
          expect(container.querySelector('[data-slot="rich-text-toolbar"]')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('should switch to code editor when Code button is clicked', async () => {
      const { container, user } = renderWithProviders(
        <TemplateEditor value="<p>Hello</p>" onChange={vi.fn()} mimeType="text/html" />
      );

      await waitFor(
        () => expect(container.querySelector('[data-slot="rich-text-editor"]')).toBeInTheDocument(),
        { timeout: 5000 }
      );
      await user.click(screen.getByLabelText('Code'));
      await waitFor(
        () => expect(container.querySelector('[data-slot="code-editor"]')).toBeInTheDocument(),
        { timeout: 5000 }
      );
      expect(container.querySelector('[data-slot="rich-text-editor"]')).not.toBeInTheDocument();
    });

    it('should expose insertAtCursor via ref in rich text mode', async () => {
      const ref = createRef<TemplateEditorHandle>();
      renderWithProviders(
        <TemplateEditor ref={ref} value="<p>Hello</p>" onChange={vi.fn()} mimeType="text/html" />
      );
      await waitFor(() => expect(ref.current).toBeDefined());
      expect(typeof ref.current?.insertAtCursor).toBe('function');
    });
  });
});
