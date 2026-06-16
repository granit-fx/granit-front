import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoryTree } from '../components/category-tree.tsx';
import { TagChipStrip } from '../components/tag-chip-strip.tsx';
import { TagManager } from '../components/tag-manager.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { CategoryResponse, TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const tag: TagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: toISODateString('2026-05-01T08:00:00Z'),
  concurrencyStamp: 'stamp-1',
};

const root: CategoryResponse = {
  id: 'cat-1',
  tenantId: null,
  scope: 'documents',
  parentId: null,
  path: '/legal',
  name: 'legal',
  depth: 0,
  iconName: null,
  hideOnEntityCard: false,
  hasChildren: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
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

describe('TagChipStrip — autocomplete editing branch', () => {
  it('renders the autocomplete combobox when canManage and + Tag is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.includes('/assignments')) return Promise.resolve({ data: { items: [tag] } });
      return Promise.resolve({ data: [] });
    }) as AxiosInstance['get']);

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
    await userEvent.click(screen.getByText('+ Tag'));

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

describe('TagManager — hex validation + draft branches', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('surfaces 409 conflicts on create as a localised message', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    vi.mocked(client.post).mockRejectedValue({
      response: { status: 409 },
      message: 'fallback',
    });

    render(<TagManager scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByRole('button', { name: 'New tag' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'New tag' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Urgent');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(screen.getByText('A tag with this name already exists.')).toBeInTheDocument()
    );
  });

  it('renders an editable name input only when canManage is true', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });

    render(<TagManager scope="documents" canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByDisplayValue('Urgent')).toBeInTheDocument());
  });
});

describe('CategoryTree — 422 cycle + cross-scope branches', () => {
  beforeEach(() => {
    vi.spyOn(window, 'prompt').mockImplementation(() => null);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps a 422 cycle on move to the localised message', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.post).mockRejectedValue({
      response: { status: 422, data: { detail: 'cycle' } },
      message: 'fallback',
    });
    vi.mocked(window.prompt).mockReturnValueOnce('cat-other');

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Move' })[0]!);

    await waitFor(() =>
      expect(
        screen.getByText('Cannot move a category under one of its descendants.')
      ).toBeInTheDocument()
    );
  });

  it('maps a 422 has-assignments on delete to the localised message', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.delete).mockRejectedValue({
      response: { status: 422, data: { detail: 'has-assignments' } },
      message: 'fallback',
    });

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);

    await waitFor(() =>
      expect(
        screen.getByText('Cannot delete: this category has active assignments.')
      ).toBeInTheDocument()
    );
  });

  it('skips the create POST when the Add prompt is cancelled at root', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    vi.mocked(client.post).mockResolvedValue({ data: root });
    vi.mocked(window.prompt).mockReturnValueOnce(null);

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('No categories.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    expect(client.post).not.toHaveBeenCalled();
  });
});
