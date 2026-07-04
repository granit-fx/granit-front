import { GranitClientProvider } from '@granit/react-api-client';
import { EntityRendererProvider } from '@granit/react-entities';
import {
  ENTITIES_BASE_PATH,
  SAMPLE_ENTITY_ID,
  SAMPLE_ENTITY_NAME,
  createEntitiesHandlers,
} from '@granit/react-entities/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { SidePeekDrawer } from './side-peek-drawer';

import type { ReactNode } from 'react';
import type * as ReactRouterDom from 'react-router-dom';

const navigateSpy = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return { ...actual, useNavigate: () => navigateSpy };
});

const ORIGIN = 'http://localhost';
const PARTY_ROW = '/api/v1/parties';

// Absolute-URL handlers so the axios `baseURL` origin is matched by MSW.
function baseHandlers() {
  return [
    ...createEntitiesHandlers(`${ORIGIN}${ENTITIES_BASE_PATH}`),
    http.get(`${ORIGIN}${PARTY_ROW}/:id`, () =>
      HttpResponse.json({ id: SAMPLE_ENTITY_ID, number: 'P-001', kind: 'Company' })
    ),
  ];
}

const server = setupServer(...baseHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...baseHandlers());
  navigateSpy.mockReset();
});
afterAll(() => server.close());

const PEEK_SEARCH = `?peek=${encodeURIComponent(SAMPLE_ENTITY_NAME)}:${encodeURIComponent(
  SAMPLE_ENTITY_ID
)}`;

function renderDrawer(
  options: { readonly search?: string; readonly activeWorkspaceName?: string | null } = {}
) {
  const { search = '', activeWorkspaceName } = options;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: ORIGIN });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[`/parties${search}`]}>
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>
          <EntityRendererProvider>{children}</EntityRendererProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
  return render(<SidePeekDrawer activeWorkspaceName={activeWorkspaceName} />, { wrapper });
}

describe('SidePeekDrawer', () => {
  it('stays closed when the URL carries no peek parameter', () => {
    renderDrawer();
    expect(document.querySelector('[data-slot="side-peek-drawer"]')).toBeNull();
  });

  it('opens the drawer and shows a loading skeleton before the entity resolves', () => {
    renderDrawer({ search: PEEK_SEARCH });
    const drawer = document.querySelector('[data-slot="side-peek-drawer"]');
    expect(drawer).not.toBeNull();
    // EntityDetailContent has not resolved yet — populated body absent.
    expect(document.querySelector('[data-slot="entity-detail-content"]')).toBeNull();
  });

  it('renders the entity detail body once the manifest and row resolve', async () => {
    renderDrawer({ search: PEEK_SEARCH });
    await waitFor(() =>
      expect(document.querySelector('[data-slot="entity-detail-content"]')).not.toBeNull()
    );
  });

  it('navigates to the workspace-scoped relation URL when a workspace is active', async () => {
    renderDrawer({ search: PEEK_SEARCH, activeWorkspaceName: 'parties' });
    const button = await waitFor(() => {
      const el = document.querySelector('[data-relation="Invoices"]');
      expect(el).not.toBeNull();
      return el as HTMLButtonElement;
    });
    fireEvent.click(button);
    expect(navigateSpy).toHaveBeenCalledWith(
      `/w/${encodeURIComponent('parties')}/${encodeURIComponent(
        'Granit.Invoicing.Invoice'
      )}?source=${encodeURIComponent(SAMPLE_ENTITY_ID)}`
    );
  });

  it('closes the peek without a workspace navigation when no workspace is active', async () => {
    renderDrawer({ search: PEEK_SEARCH, activeWorkspaceName: null });
    const button = await waitFor(() => {
      const el = document.querySelector('[data-relation="Invoices"]');
      expect(el).not.toBeNull();
      return el as HTMLButtonElement;
    });
    fireEvent.click(button);
    // No `/w/...` deep-link — only the closePeek replace-navigation fires.
    const workspaceCall = navigateSpy.mock.calls.find(
      (call) => typeof call[0] === 'string' && (call[0] as string).startsWith('/w/')
    );
    expect(workspaceCall).toBeUndefined();
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/parties', search: '' }),
      expect.objectContaining({ replace: true })
    );
  });

  it('closes the peek when the Sheet requests dismissal via Escape (onOpenChange)', async () => {
    renderDrawer({ search: PEEK_SEARCH });
    await waitFor(() =>
      expect(document.querySelector('[data-slot="side-peek-drawer"]')).not.toBeNull()
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/parties', search: '' }),
      expect.objectContaining({ replace: true })
    );
  });

  it('expands the top peek to the full detail page via the keyboard shortcut', async () => {
    renderDrawer({ search: PEEK_SEARCH });
    await waitFor(() =>
      expect(document.querySelector('[data-slot="side-peek-drawer"]')).not.toBeNull()
    );
    fireEvent.keyDown(document, { key: '.', metaKey: true, shiftKey: true });
    expect(navigateSpy).toHaveBeenCalledWith(`/entity/${encodeURIComponent(SAMPLE_ENTITY_ID)}`);
  });
});
