import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { entityTaxonomy } from '../contributions/entity-taxonomy.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
      </QueryClientProvider>
    );
  };
}

describe('entityTaxonomy', () => {
  it('returns a renderer that mounts both chip strip and selector by default', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    const Renderer = entityTaxonomy({ scope: 'documents' });

    const { container } = render(
      <Renderer entityName="Granit.Documents.Domain.Document" entityId="doc-1" />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => {
      expect(container.querySelector('[data-granit-tag-chip-strip]')).toBeTruthy();
      expect(container.querySelector('[data-granit-category-selector]')).toBeTruthy();
    });
  });

  it('omits the chip strip when showTags is false', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    const Renderer = entityTaxonomy({ scope: 'documents', showTags: false });

    const { container } = render(
      <Renderer entityName="Granit.Documents.Domain.Document" entityId="doc-1" />,
      { wrapper: createWrapper(client) }
    );

    expect(container.querySelector('[data-granit-tag-chip-strip]')).toBeNull();
    expect(container.querySelector('[data-granit-category-selector]')).toBeTruthy();
  });

  it('returns a no-op renderer when both showTags and showCategory are false', () => {
    const Renderer = entityTaxonomy({ scope: 'documents', showTags: false, showCategory: false });
    const { container } = render(
      <Renderer entityName="Granit.Documents.Domain.Document" entityId="doc-1" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('forwards categoryId to the selector', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.includes('/categories/cat-9')) {
        return Promise.resolve({
          data: {
            id: 'cat-9',
            scope: 'documents',
            parentId: null,
            path: '/legal',
            name: 'legal',
            depth: 0,
            hasChildren: false,
            breadcrumb: [
              {
                id: 'cat-9',
                scope: 'documents',
                parentId: null,
                path: '/legal',
                name: 'legal',
                depth: 0,
                hasChildren: false,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    }) as AxiosInstance['get']);

    const Renderer = entityTaxonomy({ scope: 'documents', showTags: false });
    render(
      <Renderer
        entityName="Granit.Documents.Domain.Document"
        entityId="doc-1"
        categoryId="cat-9"
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
  });
});
