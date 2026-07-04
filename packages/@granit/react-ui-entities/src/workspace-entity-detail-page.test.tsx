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
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { WorkspaceEntityDetailPage } from './workspace-entity-detail-page';

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// MSW — the detail body (`<EntityDetailContent />`) drives discovery, the
// per-entity manifest, relation aggregates and the single-row read. Reuse the
// shared handlers plus the row endpoint hanging off `links.list`.
// ---------------------------------------------------------------------------

const ORIGIN = 'http://localhost';
const ROW_BASE_PATH = '/api/v1/parties';

/** Raw camelCase wire row returned by `GET /api/v1/parties/{id}`. */
const ROW: Record<string, unknown> = { number: 'P-001', kind: 'Company' };

function rowHandler(row: Record<string, unknown> = ROW) {
  return http.get(`${ORIGIN}${ROW_BASE_PATH}/:id`, () => HttpResponse.json(row));
}

function baseHandlers() {
  return [...createEntitiesHandlers(`${ORIGIN}${ENTITIES_BASE_PATH}`), rowHandler()];
}

const server = setupServer(...baseHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...baseHandlers()));
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Render harness — QueryClient + Granit axios client + entity renderer +
// a router that supplies the `/w/:workspace/:entity/:id` route params. The
// probe mirrors the live location so back / relation navigations are
// observable without mocking `useNavigate`.
// ---------------------------------------------------------------------------

let lastLocation = '';
function LocationProbe() {
  const loc = useLocation();
  lastLocation = `${loc.pathname}${loc.search}`;
  return null;
}

function renderAt(
  initialEntry: string,
  routePath: string,
  ui: ReactNode = <WorkspaceEntityDetailPage />
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: ORIGIN });
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>
          <EntityRendererProvider>
            <Routes>
              <Route path={routePath} element={ui} />
            </Routes>
            <LocationProbe />
          </EntityRendererProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const DETAIL_PATH = '/w/:workspace/:entity/:id';
const WORKSPACE = 'acme';
const detailEntry = `/w/${WORKSPACE}/${SAMPLE_ENTITY_NAME}/${SAMPLE_ENTITY_ID}`;

describe('WorkspaceEntityDetailPage', () => {
  it('renders the missing-parameter shell when all route params are absent', () => {
    const { container } = renderAt('/detail', '/detail');
    const layout = container.querySelector('[data-slot="entity-page-layout"]');
    expect(layout).not.toBeNull();
    expect(layout?.getAttribute('data-content-width')).toBe('comfortable');
    // The missing-param shell renders its own title header and no back slot.
    expect(container.querySelector('[data-slot="entity-page-header"] h1')).not.toBeNull();
    expect(container.querySelector('[data-slot="workspace-entity-detail-page"]')).toBeNull();
    expect(container.querySelector('[data-slot="entity-page-back"]')).toBeNull();
  });

  it('renders the missing-parameter shell when only the entity + id are absent', () => {
    // workspace resolves, entity/id do not => second operand of the guard.
    const { container } = renderAt(`/w/${WORKSPACE}`, '/w/:workspace');
    expect(container.querySelector('[data-slot="entity-page-layout"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="workspace-entity-detail-page"]')).toBeNull();
  });

  it('renders the missing-parameter shell when only the id is absent', () => {
    // workspace + entity resolve, id does not => third operand of the guard.
    const { container } = renderAt(
      `/w/${WORKSPACE}/${SAMPLE_ENTITY_NAME}`,
      '/w/:workspace/:entity'
    );
    expect(container.querySelector('[data-slot="entity-page-layout"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="workspace-entity-detail-page"]')).toBeNull();
  });

  it('mounts the detail shell (back slot + detail content) when every param resolves', async () => {
    const { container } = renderAt(detailEntry, DETAIL_PATH);
    const shell = container.querySelector('[data-slot="workspace-entity-detail-page"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute('data-content-width')).toBe('comfortable');
    // Back-button slot is mounted; the detail body owns its own title header.
    expect(container.querySelector('[data-slot="entity-page-back"] button')).not.toBeNull();
    expect(container.querySelector('[data-slot="entity-page-header"]')).toBeNull();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="entity-detail-content"]')).not.toBeNull()
    );
  });

  it('navigates back to the workspace list when the back button is clicked', async () => {
    const { container } = renderAt(detailEntry, DETAIL_PATH);
    await waitFor(() =>
      expect(container.querySelector('[data-slot="entity-detail-content"]')).not.toBeNull()
    );
    const backButton = container.querySelector(
      '[data-slot="entity-page-back"] button'
    ) as HTMLButtonElement;
    fireEvent.click(backButton);
    await waitFor(() =>
      expect(lastLocation).toBe(
        `/w/${encodeURIComponent(WORKSPACE)}/${encodeURIComponent(SAMPLE_ENTITY_NAME)}`
      )
    );
  });

  it('navigates to the relation target with the source id when a relation is clicked', async () => {
    const { container } = renderAt(detailEntry, DETAIL_PATH);
    // The shared manifest declares a SmartButton relation (Invoices).
    const relation = await waitFor(() => {
      const el = container.querySelector('[data-granit-relation-item]');
      expect(el).not.toBeNull();
      return el as Element;
    });
    fireEvent.click(relation);
    const target = encodeURIComponent('Granit.Invoicing.Invoice');
    await waitFor(() =>
      expect(lastLocation).toBe(
        `/w/${encodeURIComponent(WORKSPACE)}/${target}?source=${encodeURIComponent(SAMPLE_ENTITY_ID)}`
      )
    );
  });
});
