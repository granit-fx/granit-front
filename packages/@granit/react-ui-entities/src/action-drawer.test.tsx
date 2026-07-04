import { GranitClientProvider } from '@granit/react-api-client';
import {
  EntityActionDrawerHost,
  EntityRendererProvider,
  useEntityActionDrawer,
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
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ActionDrawer } from './action-drawer';
import { EntityActionScopeProvider, useEntityActionScope } from './entity-action-scope';

import type { EntityActionManifest } from '@granit/entities';
import type { ReactNode } from 'react';

// The Granit Axios client is created with `baseURL: 'http://localhost'`, so
// requests are fully-qualified — the MSW handlers must be too.
const ORIGIN = 'http://localhost';
// The overlay reads hang off `/api/v1/{entityName}` (not the discovery
// `/api/v1/entities/{name}` manifest route), so the row handler is keyed on
// the literal entity name to avoid colliding with the manifest handlers.
const ROW_PATH = `${ORIGIN}/api/v1/${SAMPLE_ENTITY_NAME}/:id`;
const MANIFEST_PATH = `${ORIGIN}${ENTITIES_BASE_PATH}/:name`;
const DEFAULT_ROW = { number: 'P-001', kind: 'Person' };

function rowHandler(body: unknown = DEFAULT_ROW) {
  return http.get(ROW_PATH, () => HttpResponse.json(body));
}

// Entities handlers cover the `/api/v1/entities/{name}` manifest route; the
// row handler covers the overlay read at `/api/v1/{entityName}/{id}`.
const server = setupServer(
  ...createEntitiesHandlers(`${ORIGIN}${ENTITIES_BASE_PATH}`),
  rowHandler()
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeAction(overrides: Partial<EntityActionManifest> = {}): EntityActionManifest {
  return {
    name: 'view',
    kind: 'OpenDrawer',
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

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>
          <EntityRendererProvider>
            <EntityActionScopeProvider>
              <EntityActionDrawerHost>{children}</EntityActionDrawerHost>
            </EntityActionScopeProvider>
          </EntityRendererProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    );
  };
}

interface HarnessProps {
  readonly action: EntityActionManifest;
  readonly rowId: string | null;
  readonly entityName: string | null;
}

function DrawerHarness({ action, rowId, entityName }: HarnessProps) {
  const drawer = useEntityActionDrawer();
  const scope = useEntityActionScope();
  return (
    <>
      <button
        type="button"
        data-testid="open"
        onClick={() => {
          scope.setEntityName(entityName);
          drawer.open({ action, rowId, row: null });
        }}
      >
        open
      </button>
      <ActionDrawer />
    </>
  );
}

function renderClosed(props: HarnessProps) {
  const Wrapper = makeWrapper();
  return render(
    <Wrapper>
      <DrawerHarness {...props} />
    </Wrapper>
  );
}

function renderOpen(props: HarnessProps) {
  const utils = renderClosed(props);
  fireEvent.click(utils.getByTestId('open'));
  return utils;
}

const title = () => document.body.querySelector('[data-slot="sheet-title"]')?.textContent;
const sheetContent = () => document.body.querySelector('[data-slot="sheet-content"]');
const frame = () =>
  document.body.querySelector<HTMLIFrameElement>('[data-granit-action-drawer-url-frame]');

describe('ActionDrawer', () => {
  it('keeps the sheet body unmounted while the drawer is closed', () => {
    renderClosed({ action: makeAction(), rowId: 'r1', entityName: SAMPLE_ENTITY_NAME });
    expect(sheetContent()).toBeNull();
  });

  it('opens the sheet with the action name as title when no displayKey is set', () => {
    renderOpen({
      action: makeAction({ displayKey: null, name: 'View details', urlTemplate: 'https://x/y' }),
      rowId: 'r1',
      entityName: null,
    });
    expect(sheetContent()).not.toBeNull();
    expect(title()).toBe('View details');
    // sr-only description branch is always emitted for a11y.
    expect(document.body.querySelector('[data-slot="sheet-description"]')).not.toBeNull();
  });

  it('closes the drawer (via onOpenChange) when the sheet is dismissed', async () => {
    renderOpen({
      action: makeAction({ urlTemplate: 'https://x/y' }),
      rowId: 'r1',
      entityName: null,
    });
    expect(sheetContent()).not.toBeNull();
    // Escape drives Radix's onOpenChange(false) → drawer.close() → unmount.
    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(sheetContent()).toBeNull());
  });

  it('resolves the translated displayKey (falling back to the action name)', () => {
    renderOpen({
      action: makeAction({ displayKey: 'Actions.View', name: 'view', urlTemplate: 'https://x/y' }),
      rowId: 'r1',
      entityName: null,
    });
    // Without an i18n provider the no-op `t` returns its string fallback (name).
    expect(title()).toBe('view');
  });

  it('falls back to the generic Drawer title when neither displayKey nor name is set', () => {
    renderOpen({
      action: makeAction({
        displayKey: null,
        // Defensive `?? t('Common.Drawer')` branch — the wire type is
        // non-nullable but the runtime guards against a missing name.
        name: null as unknown as string,
        urlTemplate: 'https://x/y',
      }),
      rowId: 'r1',
      entityName: null,
    });
    expect(title()).toBe('Drawer');
  });

  it('renders a sandboxed iframe with the row id substituted for {id}', () => {
    renderOpen({
      action: makeAction({ urlTemplate: 'https://example.com/wizard?id={id}' }),
      rowId: 'row 1',
      entityName: null,
    });
    const iframe = frame();
    expect(iframe).not.toBeNull();
    // replaceAll + encodeURIComponent: the space becomes %20.
    expect(iframe?.getAttribute('src')).toBe('https://example.com/wizard?id=row%201');
    expect(iframe?.getAttribute('sandbox')).toBe('allow-forms allow-same-origin allow-scripts');
    expect(iframe?.getAttribute('title')).toBe('Drawer content');
  });

  it('uses the raw template unchanged when the row id is null', () => {
    renderOpen({
      action: makeAction({ urlTemplate: 'https://example.com/plain' }),
      rowId: null,
      entityName: null,
    });
    expect(frame()?.getAttribute('src')).toBe('https://example.com/plain');
  });

  it('shows the no-row message when the scope has no active entity', () => {
    renderOpen({
      action: makeAction({ urlTemplate: null }),
      rowId: 'r1',
      entityName: null,
    });
    expect(sheetContent()?.textContent).toContain('No row context.');
  });

  it('shows the no-row message when the row id is null (detail branch)', () => {
    renderOpen({
      action: makeAction({ urlTemplate: null }),
      rowId: null,
      entityName: SAMPLE_ENTITY_NAME,
    });
    expect(sheetContent()?.textContent).toContain('No row context.');
  });

  it('shows a loading skeleton then renders the entity detail once data lands', async () => {
    renderOpen({
      action: makeAction({ urlTemplate: null }),
      rowId: 'row-001',
      entityName: SAMPLE_ENTITY_NAME,
    });
    // Both the manifest and the row query are in-flight → skeleton branch.
    expect(document.body.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    await waitFor(() =>
      expect(document.body.querySelector('[data-granit-detail-row]')).not.toBeNull()
    );
    const numberRow = document.body.querySelector(
      '[data-granit-detail-row][data-property="Number"]'
    );
    expect(numberRow?.querySelector('dd')?.textContent).toBe('P-001');
  });

  it('renders the detail with an empty form-variant list when the manifest omits forms', async () => {
    server.use(
      http.get(MANIFEST_PATH, () =>
        HttpResponse.json({
          ...mockEntityManifest,
          forms: null,
          details: [
            {
              name: 'default',
              sections: [
                {
                  key: 'main',
                  labelKey: null,
                  order: 0,
                  inheritsFromFormVariant: null,
                  fields: ['Number'],
                },
              ],
              sidePanels: [],
            },
          ],
        })
      )
    );
    renderOpen({
      action: makeAction({ urlTemplate: null }),
      rowId: 'row-001',
      entityName: SAMPLE_ENTITY_NAME,
    });
    await waitFor(() =>
      expect(document.body.querySelector('[data-granit-detail-row]')).not.toBeNull()
    );
    const numberRow = document.body.querySelector(
      '[data-granit-detail-row][data-property="Number"]'
    );
    expect(numberRow?.querySelector('dd')?.textContent).toBe('P-001');
  });

  it('shows the no-detail message when the manifest declares no detail variant', async () => {
    server.use(
      http.get(MANIFEST_PATH, () => HttpResponse.json({ ...mockEntityManifest, details: [] }))
    );
    renderOpen({
      action: makeAction({ urlTemplate: null }),
      rowId: 'row-001',
      entityName: SAMPLE_ENTITY_NAME,
    });
    await waitFor(() => expect(sheetContent()?.textContent).toContain('No details available.'));
  });

  it('shows the no-detail message when the manifest request fails', async () => {
    server.use(
      http.get(MANIFEST_PATH, () => HttpResponse.json({ error: 'boom' }, { status: 500 }))
    );
    renderOpen({
      action: makeAction({ urlTemplate: null }),
      rowId: 'row-001',
      entityName: SAMPLE_ENTITY_NAME,
    });
    await waitFor(() => expect(sheetContent()?.textContent).toContain('No details available.'));
  });
});
