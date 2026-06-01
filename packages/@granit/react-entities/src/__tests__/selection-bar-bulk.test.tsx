import { GranitClientProvider } from '@granit/react-api-client';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EntitySelectionBar } from '../components/entity-selection-bar';
import { SelectionProvider } from '../selection/selection-provider';

import type {
  BulkActionResponse,
  EntityActionManifest,
  EntityManifestResponse,
  EntitySelectionActionManifest,
} from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY_NAME = 'Granit.Sales.Quote';
const BULK_PATH = `http://localhost/api/v1/entities/${encodeURIComponent(ENTITY_NAME)}/bulk/approve`;

const FULL_SUCCESS: BulkActionResponse = {
  ok: ['q1', 'q2', 'q3'],
  failed: [],
  parents: ['Party:p1', 'Party:p2'],
};

const PARTIAL_FAILURE: BulkActionResponse = {
  ok: ['q1', 'q3'],
  failed: [{ id: 'q2', error: 'Workflow blocked', errorCode: 'wf.blocked' }],
  parents: ['Party:p1'],
};

let lastBulkBody: { ids: readonly string[] } | null = null;
let bulkCallCount = 0;
let perRowCallCount = 0;

function freshHandlers() {
  return [
    http.post(BULK_PATH, async ({ request }) => {
      bulkCallCount += 1;
      lastBulkBody = (await request.json()) as { ids: readonly string[] };
      return HttpResponse.json(FULL_SUCCESS);
    }),
    // Per-row apiCall fallback (for the "predicate excludes" regression case)
    http.post(/\/api\/.+\/[^/]+$/, () => {
      perRowCallCount += 1;
      return HttpResponse.json({});
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  lastBulkBody = null;
  bulkCallCount = 0;
  perRowCallCount = 0;
  vi.restoreAllMocks();
});
afterAll(() => server.close());

function makeAction(): EntityActionManifest {
  return {
    name: 'approve',
    kind: 'ApiCall',
    displayKey: 'Sales.Quote.Approve',
    icon: 'check',
    order: 0,
    urlTemplate: '/api/quotes/{id}/approve',
    httpMethod: 'POST',
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
  };
}

function makeRef(): EntitySelectionActionManifest {
  return {
    name: 'approve',
    displayKey: null,
    icon: 'check',
    confirmationKey: null,
    contributorAssemblyName: null,
  };
}

function makeManifest(): EntityManifestResponse {
  return {
    schemaVersion: 1,
    identity: {
      name: ENTITY_NAME,
      entityClrType: 'Granit.Sales.Domain.Quote',
      displayKey: null,
      icon: null,
      permissionGroup: null,
      displayProperty: 'name',
      subtitleProperty: null,
    },
    permissions: null,
    forms: null,
    details: null,
    collections: {
      query: null,
      export: null,
      metrics: [],
      dashboards: [],
      defaultViewId: null,
      listLayouts: [],
      headerActions: [],
      selectionActions: [makeRef()],
    },
    relations: null,
    actions: [makeAction()],
  };
}

function makeWrapper() {
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return ({ children }: { children: ReactNode }) => (
    <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
  );
}

describe('EntitySelectionBar — bulk endpoint dispatch', () => {
  it('routes a click through POST /bulk/{action} with all ids when bulkEndpoint=true', async () => {
    const Wrapper = makeWrapper();
    const onComplete = vi.fn();

    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['q1', 'q2', 'q3']}>
          <EntitySelectionBar manifest={makeManifest()} bulkEndpoint onComplete={onComplete} />
        </SelectionProvider>
      </Wrapper>
    );

    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(bulkCallCount).toBe(1);
    expect(perRowCallCount).toBe(0);
    expect(lastBulkBody).toEqual({ ids: ['q1', 'q2', 'q3'] });
  });

  it('exposes parents from the response in the recap (used by D3 cache eviction)', async () => {
    const Wrapper = makeWrapper();
    const onComplete = vi.fn();

    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['q1', 'q2', 'q3']}>
          <EntitySelectionBar manifest={makeManifest()} bulkEndpoint onComplete={onComplete} />
        </SelectionProvider>
      </Wrapper>
    );

    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());

    const recap = onComplete.mock.calls[0]?.[1];
    expect(recap.succeeded).toEqual(['q1', 'q2', 'q3']);
    expect(recap.failed).toHaveLength(0);
    expect(recap.parents).toEqual(['Party:p1', 'Party:p2']);
  });

  it('keeps failed rows selected and surfaces per-id errors on partial failure', async () => {
    server.use(http.post(BULK_PATH, () => HttpResponse.json(PARTIAL_FAILURE)));

    const Wrapper = makeWrapper();
    const onComplete = vi.fn();

    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['q1', 'q2', 'q3']}>
          <EntitySelectionBar manifest={makeManifest()} bulkEndpoint onComplete={onComplete} />
        </SelectionProvider>
      </Wrapper>
    );

    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());

    const recap = onComplete.mock.calls[0]?.[1];
    expect(recap.succeeded).toEqual(['q1', 'q3']);
    expect(recap.failed).toHaveLength(1);
    expect(recap.failed[0]?.id).toBe('q2');
    expect(recap.failed[0]?.error).toMatchObject({ errorCode: 'wf.blocked' });

    // After partial failure, selection narrows to the failed ids so the
    // user can retry without re-picking the rows.
    const bar = container.querySelector('[data-granit-entity-selection-bar]') as HTMLElement;
    await waitFor(() => expect(bar.getAttribute('data-selected-count')).toBe('1'));
  });

  it('surfaces every id as failed against the root error when the endpoint itself rejects', async () => {
    server.use(http.post(BULK_PATH, () => HttpResponse.text('forbidden', { status: 403 })));

    const Wrapper = makeWrapper();
    const onComplete = vi.fn();

    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['q1', 'q2', 'q3']}>
          <EntitySelectionBar manifest={makeManifest()} bulkEndpoint onComplete={onComplete} />
        </SelectionProvider>
      </Wrapper>
    );

    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());

    const recap = onComplete.mock.calls[0]?.[1];
    expect(recap.succeeded).toHaveLength(0);
    expect(recap.failed.map((f: { id: string }) => f.id)).toEqual(['q1', 'q2', 'q3']);
    expect(recap.parents).toBeUndefined();
  });

  it('predicate form: bulk path engaged only for matching action names', async () => {
    const Wrapper = makeWrapper();
    const onComplete = vi.fn();
    const apiCall = vi.fn(async () => {});
    const predicate = vi.fn((action: EntitySelectionActionManifest) => action.name === 'approve');

    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['q1', 'q2']}>
          <EntitySelectionBar
            manifest={makeManifest()}
            bulkEndpoint={predicate}
            handlers={{ apiCall }}
            onComplete={onComplete}
          />
        </SelectionProvider>
      </Wrapper>
    );

    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());

    expect(predicate).toHaveBeenCalledWith(expect.objectContaining({ name: 'approve' }));
    expect(bulkCallCount).toBe(1);
    expect(apiCall).not.toHaveBeenCalled(); // per-row dispatcher bypassed
  });

  it('bulkEndpoint=false keeps the per-row fan-out (regression)', async () => {
    const Wrapper = makeWrapper();
    const onComplete = vi.fn();
    const apiCall = vi.fn(async () => {});

    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['q1', 'q2', 'q3']}>
          <EntitySelectionBar
            manifest={makeManifest()}
            bulkEndpoint={false}
            handlers={{ apiCall }}
            onComplete={onComplete}
          />
        </SelectionProvider>
      </Wrapper>
    );

    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());

    expect(bulkCallCount).toBe(0);
    expect(apiCall).toHaveBeenCalledTimes(3);
  });
});
