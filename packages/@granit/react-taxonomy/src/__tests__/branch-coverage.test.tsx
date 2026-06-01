import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CategorySelector } from '../components/category-selector.tsx';
import { CategoryTree } from '../components/category-tree.tsx';
import { TagAutocomplete } from '../components/tag-autocomplete.tsx';
import { TagChipStrip } from '../components/tag-chip-strip.tsx';
import { TagManager } from '../components/tag-manager.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { CategoryResponse, TagAssignmentResponse, TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const tag: TagResponse = {
  id: 'tag-1',
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: '2026-05-01T08:00:00Z',
  updatedAt: '2026-05-01T08:00:00Z',
};

const root: CategoryResponse = {
  id: 'cat-1',
  scope: 'documents',
  parentId: null,
  path: '/legal',
  name: 'legal',
  depth: 0,
  hasChildren: false,
};

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

describe('TagChipStrip — manage flow', () => {
  it('unassigns when × is clicked on a chip under canManage', async () => {
    const client = createMockClient();
    const assignment: TagAssignmentResponse = {
      tagId: 'tag-1',
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
      assignedAt: '2026-05-02T12:00:00Z',
    };
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.endsWith('/tags/assignments')) return Promise.resolve({ data: [assignment] });
      if (url.endsWith('/tags')) return Promise.resolve({ data: [tag] });
      return Promise.resolve({ data: [] });
    }) as AxiosInstance['get']);
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(
      <TagChipStrip
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        canManage
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('Urgent')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Remove Urgent/i }));

    await waitFor(() =>
      expect(client.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/taxonomy/tags/tag-1/assign/')
      )
    );
  });

  it('renders the error state when the assignments query fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('boom'));

    render(
      <TagChipStrip
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});

describe('TagAutocomplete — Arrow Up + Escape', () => {
  it('Arrow Up clamps highlight at 0; Escape closes the dropdown', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });

    render(<TagAutocomplete scope="documents" value={[]} onAdd={vi.fn()} onRemove={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await waitFor(() => expect(client.get).toHaveBeenCalled());
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('TagManager — readonly + delete-cancel branches', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does NOT call DELETE when the confirm dialog is cancelled', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(<TagManager scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByDisplayValue('Urgent')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(client.delete).not.toHaveBeenCalled();
  });

  it('renders read-only color swatch when canManage is false', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });

    const { container } = render(<TagManager scope="documents" />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('#FF0000')).toBeInTheDocument());
    expect(container.querySelector('[data-granit-tag-color-swatch]')).toBeTruthy();
  });

  it('renders the loading state while the tags query is pending', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(() => new Promise(() => {}));

    render(<TagManager scope="documents" canManage />, { wrapper: createWrapper(client) });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});

describe('CategoryTree — error states', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'prompt').mockReturnValue(null);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the error fallback when the roots query fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('roots-failed'));

    render(<CategoryTree scope="documents" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('maps a 422 has-descendants error to its localised message', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.delete).mockRejectedValue({
      response: { status: 422, data: { detail: 'has-descendants' } },
      message: 'fallback',
    });

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);

    await waitFor(() =>
      expect(screen.getByText(/Cannot delete: this category has descendants/)).toBeInTheDocument()
    );
  });

  it('Loading state on roots query', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(() => new Promise(() => {}));

    render(<CategoryTree scope="documents" />, { wrapper: createWrapper(client) });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});

describe('CategorySelector — clear flow', () => {
  it('DELETEs assignment when Clear is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: {
        ...root,
        breadcrumb: [root],
      },
    });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(
      <CategorySelector
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        value="cat-1"
        canManage
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() =>
      expect(client.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/taxonomy/categories/assign/')
      )
    );
  });
});
