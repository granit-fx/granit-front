import { screen } from '@testing-library/react';

import { WorkspaceCapabilities } from '../components/workspace-capabilities';

import { renderWithProviders } from './test-utils';

import type { AIModelCapabilities } from '@granit/ai';

const fullCaps: AIModelCapabilities = {
  chat: true,
  embeddings: false,
  vision: true,
  imageGeneration: false,
  audio: false,
  toolUse: true,
  streaming: true,
  structuredOutput: false,
  extensions: ['custom-ext'],
};

describe('WorkspaceCapabilities', () => {
  it('renders nothing when capabilities are null', () => {
    const { container } = renderWithProviders(<WorkspaceCapabilities capabilities={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a badge for every known capability key', () => {
    renderWithProviders(<WorkspaceCapabilities capabilities={fullCaps} />);
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Vision')).toBeInTheDocument();
    expect(screen.getByText('Tool Use')).toBeInTheDocument();
    expect(screen.getByText('Embeddings')).toBeInTheDocument();
    expect(screen.getByText('Structured Output')).toBeInTheDocument();
  });

  it('renders extension badges verbatim', () => {
    renderWithProviders(<WorkspaceCapabilities capabilities={fullCaps} />);
    expect(screen.getByText('custom-ext')).toBeInTheDocument();
  });
});
