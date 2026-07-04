import { GranitClientProvider } from '@granit/react-api-client';
import {
  EntityActionModalContext,
  EntityRendererProvider,
  SelectionProvider,
} from '@granit/react-entities';
import {
  ENTITIES_BASE_PATH,
  SAMPLE_ENTITY_NAME,
  createEntitiesHandlers,
  mockEntityManifest,
} from '@granit/react-entities/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useEffect } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ActionModal } from './action-modal';
import { EntityActionScopeProvider, useEntityActionScope } from './entity-action-scope';

import type { EntityActionManifest, EntityManifestResponse } from '@granit/entities';
import type {
  EntityActionOverlayContextValue,
  EntityActionOverlayState,
} from '@granit/react-entities';
import type { ReactNode } from 'react';

const ORIGIN = 'http://localhost';
const MANIFEST_BASE = `${ORIGIN}${ENTITIES_BASE_PATH}`;
const ROW_PATH = `${ORIGIN}/api/v1/${SAMPLE_ENTITY_NAME}/:id`;

function baseHandlers() {
  return [
    ...createEntitiesHandlers(MANIFEST_BASE),
    http.get(ROW_PATH, () => HttpResponse.json({ number: 'ACME-001', kind: 'Person' })),
  ];
}

const server = setupServer(...baseHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...baseHandlers()));
afterAll(() => server.close());

function makeAction(overrides: Partial<EntityActionManifest> = {}): EntityActionManifest {
  return {
    name: 'edit',
    kind: 'OpenModal',
    displayKey: null,
    icon: null,
    order: 0,
    urlTemplate: null,
    httpMethod: null,
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
    ...overrides,
  };
}

/**
 * Sets the action scope entity name and gates the children until the
 * scope reflects that name, so the modal body reads a stable
 * `scope.entityName` on first mount (no null → name flicker).
 */
function ScopeGate({ name, children }: { name: string | null; children: ReactNode }) {
  const scope = useEntityActionScope();
  useEffect(() => {
    scope.setEntityName(name);
  }, [scope, name]);
  if (scope.entityName !== name) return null;
  return children;
}

interface RenderOptions {
  readonly current: EntityActionOverlayState | null;
  readonly entityName?: string | null;
  readonly selectedIds?: readonly string[];
}

function renderModal({ current, entityName = null, selectedIds = [] }: RenderOptions) {
  const close = vi.fn();
  const modalValue: EntityActionOverlayContextValue = {
    current,
    open: vi.fn(),
    close,
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: ORIGIN });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <EntityRendererProvider>
          <SelectionProvider initialSelectedIds={selectedIds}>
            <EntityActionScopeProvider>
              <ScopeGate name={entityName}>
                <EntityActionModalContext.Provider value={modalValue}>
                  <ActionModal />
                </EntityActionModalContext.Provider>
              </ScopeGate>
            </EntityActionScopeProvider>
          </SelectionProvider>
        </EntityRendererProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return { ...result, close };
}

function state(
  action: EntityActionManifest,
  rowId: string | null = null
): EntityActionOverlayState {
  return { action, rowId, row: null };
}

describe('ActionModal', () => {
  it('renders no dialog content when the modal has no current action', () => {
    renderModal({ current: null });
    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull();
  });

  it('renders the title from displayKey and a confirmation description when both are set', () => {
    renderModal({
      current: state(
        makeAction({ displayKey: 'Action.Edit.Label', confirmationKey: 'Action.Edit.Confirm' })
      ),
    });
    const title = document.body.querySelector('[data-slot="dialog-title"]');
    // t(displayKey, name) resolves to the fallback name without an i18n bundle,
    // but the displayKey branch of the title ternary is exercised.
    expect(title?.textContent).toBe('edit');
    expect(document.body.querySelector('[data-slot="dialog-description"]')).not.toBeNull();
  });

  it('falls back to the action name for the title and omits the description when unset', () => {
    renderModal({ current: state(makeAction({ displayKey: null, name: 'archive' })) });
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('archive');
    expect(document.body.querySelector('[data-slot="dialog-description"]')).toBeNull();
  });

  it('invokes close() when the footer Close button is clicked', () => {
    const { close } = renderModal({ current: state(makeAction()) });
    const footer = document.body.querySelector('[data-slot="dialog-footer"]') as HTMLElement;
    const closeButton = footer.querySelector('button') as HTMLButtonElement;
    fireEvent.click(closeButton);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('invokes close() when the dialog dismisses itself (Escape)', () => {
    const { close } = renderModal({ current: state(makeAction()) });
    const content = document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement;
    fireEvent.keyDown(content, { key: 'Escape', code: 'Escape' });
    expect(close).toHaveBeenCalledTimes(1);
  });

  describe('urlTemplate === null → embedded entity form', () => {
    it('shows the no-entity fallback when the scope has no entity name', () => {
      renderModal({ current: state(makeAction({ urlTemplate: null }), 'row-1'), entityName: null });
      const body = document.body.querySelector('.overflow-y-auto') as HTMLElement;
      expect(body.textContent).toContain('No entity scope available.');
    });

    it('shows a skeleton while the manifest is loading', () => {
      server.use(
        http.get(`${MANIFEST_BASE}/:name`, async () => {
          await delay('infinite');
          return HttpResponse.json(mockEntityManifest);
        }),
        http.get(ROW_PATH, async () => {
          await delay('infinite');
          return HttpResponse.json({});
        })
      );
      renderModal({
        current: state(makeAction({ urlTemplate: null }), 'row-1'),
        entityName: SAMPLE_ENTITY_NAME,
      });
      expect(document.body.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    });

    it('shows the no-form fallback when the manifest exposes no form variant', async () => {
      const noForms: EntityManifestResponse = { ...mockEntityManifest, forms: [] };
      server.use(http.get(`${MANIFEST_BASE}/:name`, () => HttpResponse.json(noForms)));
      renderModal({
        current: state(makeAction({ urlTemplate: null }), 'row-1'),
        entityName: SAMPLE_ENTITY_NAME,
      });
      await waitFor(() =>
        expect(document.body.textContent).toContain('No form variant available.')
      );
    });

    it('renders the entity form once the manifest and row values land', async () => {
      renderModal({
        current: state(makeAction({ urlTemplate: null }), 'row-1'),
        entityName: SAMPLE_ENTITY_NAME,
      });
      await waitFor(() =>
        expect(document.body.querySelector('[data-granit-entity-form]')).not.toBeNull()
      );
    });

    it('renders a blank form for a header/bulk action with no row id', async () => {
      // rowId === null exercises the `rowId ?? 'new'` key fallback and the
      // `initial ?? {}` fallback (useEntity is disabled with no id, so the
      // form seeds from an empty object).
      renderModal({
        current: state(makeAction({ urlTemplate: null }), null),
        entityName: SAMPLE_ENTITY_NAME,
      });
      await waitFor(() =>
        expect(document.body.querySelector('[data-granit-entity-form]')).not.toBeNull()
      );
    });
  });

  describe('urlTemplate present → sandboxed iframe / no-url fallback', () => {
    it('substitutes {id} from the row id and encodes it into the frame src', () => {
      renderModal({
        current: state(makeAction({ urlTemplate: '/entities/{id}/edit' }), 'a/b'),
      });
      const frame = document.body.querySelector(
        '[data-granit-action-modal-url-frame]'
      ) as HTMLIFrameElement;
      expect(frame).not.toBeNull();
      expect(frame.getAttribute('src')).toBe('/entities/a%2Fb/edit');
      expect(frame.getAttribute('sandbox')).toBe('allow-forms allow-same-origin allow-scripts');
    });

    it('shows the no-url fallback when the template needs an id but the row id is null', () => {
      renderModal({
        current: state(makeAction({ urlTemplate: '/entities/{id}/edit' }), null),
      });
      expect(document.body.querySelector('[data-granit-action-modal-url-frame]')).toBeNull();
      expect(document.body.textContent).toContain('No URL available.');
    });

    it('uses the template verbatim in bulk mode when nothing is selected', () => {
      renderModal({
        current: state(makeAction({ urlTemplate: '/static/page' }), null),
        selectedIds: [],
      });
      const frame = document.body.querySelector(
        '[data-granit-action-modal-url-frame]'
      ) as HTMLIFrameElement;
      expect(frame.getAttribute('src')).toBe('/static/page');
    });

    it('appends the selection ids as a new query string (? separator)', () => {
      renderModal({
        current: state(makeAction({ urlTemplate: '/bulk' }), null),
        selectedIds: ['x', 'y'],
      });
      const frame = document.body.querySelector(
        '[data-granit-action-modal-url-frame]'
      ) as HTMLIFrameElement;
      expect(frame.getAttribute('src')).toBe('/bulk?ids=x%2Cy');
    });

    it('appends the selection ids with an & separator when the template already has a query', () => {
      renderModal({
        current: state(makeAction({ urlTemplate: '/bulk?tab=1' }), null),
        selectedIds: ['x'],
      });
      const frame = document.body.querySelector(
        '[data-granit-action-modal-url-frame]'
      ) as HTMLIFrameElement;
      expect(frame.getAttribute('src')).toBe('/bulk?tab=1&ids=x');
    });
  });
});
