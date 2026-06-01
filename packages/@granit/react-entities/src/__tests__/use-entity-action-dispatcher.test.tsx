import { GranitClientProvider } from '@granit/react-api-client';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EntityActionDrawerContext,
  EntityActionModalContext,
} from '../actions/entity-action-overlay-context';
import {
  resolveActionUrl,
  useEntityActionDispatcher,
  type EntityActionHandlers,
} from '../actions/use-entity-action-dispatcher';

import type { EntityActionManifest } from '@granit/entities';
import type { ReactNode } from 'react';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

let originalLocation: Location;

beforeEach(() => {
  originalLocation = globalThis.location;
});
afterEach(() => {
  Object.defineProperty(globalThis, 'location', { value: originalLocation, configurable: true });
});

function makeWrapper() {
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
  );
  return { wrapper };
}

function makeAction(overrides: Partial<EntityActionManifest> = {}): EntityActionManifest {
  return {
    name: 'share',
    kind: 'ApiCall',
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

describe('resolveActionUrl', () => {
  it('substitutes {id} when present', () => {
    expect(resolveActionUrl('/api/parties/{id}/share', 'abc')).toBe('/api/parties/abc/share');
  });

  it('URL-encodes the id', () => {
    expect(resolveActionUrl('/api/parties/{id}', 'a/b c')).toBe('/api/parties/a%2Fb%20c');
  });

  it('returns the template unchanged when {id} is absent', () => {
    expect(resolveActionUrl('/api/parties/import', null)).toBe('/api/parties/import');
  });

  it('throws when {id} is required but rowId is null', () => {
    expect(() => resolveActionUrl('/api/parties/{id}', null)).toThrow(/{id} placeholder/);
  });
});

describe('useEntityActionDispatcher — Navigate', () => {
  it('sets globalThis.location.href on Navigate', async () => {
    const hrefAssign = vi.fn();
    Object.defineProperty(globalThis, 'location', {
      value: { href: '', assign: hrefAssign },
      configurable: true,
      writable: true,
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(
      makeAction({ kind: 'Navigate', urlTemplate: '/import?entity=Party' }),
      null,
      null
    );
    expect(globalThis.location.href).toBe('/import?entity=Party');
  });

  it('honors a custom navigate handler when supplied', async () => {
    const navigate = vi.fn();
    const handlers: EntityActionHandlers = { navigate };
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(handlers), { wrapper });
    const action = makeAction({ kind: 'Navigate', urlTemplate: '/parties/{id}/edit' });
    await result.current(action, 'abc', null);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(action, 'abc', null, expect.anything());
  });
});

describe('useEntityActionDispatcher — ApiCall', () => {
  it('issues the declared HTTP method against the substituted URL', async () => {
    let captured: { method: string | undefined; url: string } | null = null;
    server.use(
      http.post('http://localhost/api/parties/abc/share', ({ request }) => {
        captured = { method: request.method, url: new URL(request.url).pathname };
        return HttpResponse.json({});
      })
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(
      makeAction({
        kind: 'ApiCall',
        urlTemplate: '/api/parties/{id}/share',
        httpMethod: 'POST',
      }),
      'abc',
      null
    );
    expect(captured).toEqual({ method: 'POST', url: '/api/parties/abc/share' });
  });

  it('skips the call when confirmationKey is set and the user dismisses', async () => {
    const confirmStub = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    server.use(
      http.delete('http://localhost/api/parties/abc', () =>
        HttpResponse.json({ unexpected: true }, { status: 500 })
      )
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(
      makeAction({
        kind: 'ApiCall',
        urlTemplate: '/api/parties/{id}',
        httpMethod: 'DELETE',
        confirmationKey: 'Parties.Confirm.Delete',
      }),
      'abc',
      null
    );
    expect(confirmStub).toHaveBeenCalledWith('Parties.Confirm.Delete');
  });

  it('issues the call when confirmationKey is set and the user accepts', async () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    let called = false;
    server.use(
      http.delete('http://localhost/api/parties/abc', () => {
        called = true;
        return HttpResponse.json({});
      })
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(
      makeAction({
        kind: 'ApiCall',
        urlTemplate: '/api/parties/{id}',
        httpMethod: 'DELETE',
        confirmationKey: 'Parties.Confirm.Delete',
      }),
      'abc',
      null
    );
    expect(called).toBe(true);
  });
});

describe('useEntityActionDispatcher — WorkflowTransition', () => {
  it('emits a console.warn when no workflowTransition handler is supplied', async () => {
    const warn = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => undefined);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(
      makeAction({ kind: 'WorkflowTransition', workflowTransitionName: 'Approved' }),
      'abc',
      null
    );
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain('WorkflowTransition');
  });

  it('delegates to the workflowTransition handler when supplied', async () => {
    const workflowTransition = vi.fn();
    const handlers: EntityActionHandlers = { workflowTransition };
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(handlers), { wrapper });
    const action = makeAction({ kind: 'WorkflowTransition', workflowTransitionName: 'Approved' });
    const row = { id: 'abc', workflowState: 'Draft' };
    await result.current(action, 'abc', row);
    expect(workflowTransition).toHaveBeenCalledWith(action, 'abc', row, expect.anything());
  });
});

describe('useEntityActionDispatcher — OpenDrawer / OpenModal', () => {
  it('OpenDrawer opens the drawer host context when mounted', async () => {
    const { wrapper: BaseWrapper } = makeWrapper();
    const drawerStub = { open: vi.fn(), close: vi.fn(), current: null };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <BaseWrapper>
        <EntityActionDrawerContext.Provider value={drawerStub}>
          {children}
        </EntityActionDrawerContext.Provider>
      </BaseWrapper>
    );
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    const action = makeAction({ kind: 'OpenDrawer', urlTemplate: null });
    await result.current(action, 'abc', { id: 'abc' });
    expect(drawerStub.open).toHaveBeenCalledOnce();
    expect(drawerStub.open).toHaveBeenCalledWith(
      expect.objectContaining({ action, rowId: 'abc', row: expect.objectContaining({ id: 'abc' }) })
    );
  });

  it('OpenDrawer warns when no host context and no handler is supplied', async () => {
    const warn = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => undefined);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(makeAction({ kind: 'OpenDrawer' }), 'abc', null);
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain('OpenDrawer');
  });

  it('OpenModal delegates to the openModal handler override when supplied', async () => {
    const openModal = vi.fn();
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher({ openModal }), { wrapper });
    const action = makeAction({ kind: 'OpenModal', urlTemplate: '/import?ids=1,2' });
    await result.current(action, null, null);
    expect(openModal).toHaveBeenCalledOnce();
    expect(openModal).toHaveBeenCalledWith(action, null, null, expect.anything());
  });

  it('OpenModal opens the modal host context when mounted', async () => {
    const { wrapper: BaseWrapper } = makeWrapper();
    const modalStub = { open: vi.fn(), close: vi.fn(), current: null };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <BaseWrapper>
        <EntityActionModalContext.Provider value={modalStub}>
          {children}
        </EntityActionModalContext.Provider>
      </BaseWrapper>
    );
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(makeAction({ kind: 'OpenModal' }), 'abc', null);
    expect(modalStub.open).toHaveBeenCalledOnce();
  });
});

describe('useEntityActionDispatcher — Download', () => {
  it('triggers a synthetic <a download> on Download', async () => {
    server.use(
      http.get('http://localhost/api/exports/parties.csv', () =>
        HttpResponse.text('id,name\n', {
          headers: { 'Content-Disposition': 'attachment; filename="parties.csv"' },
        })
      )
    );
    const clickSpy = vi.fn();
    const realCreate = globalThis.document.createElement.bind(globalThis.document);
    const createSpy = vi.spyOn(globalThis.document, 'createElement').mockImplementation(((
      tagName: string
    ) => {
      const node = realCreate(tagName) as HTMLElement;
      if (tagName === 'a') {
        node.click = clickSpy;
      }
      return node;
    }) as typeof globalThis.document.createElement);
    const objectUrlCreate = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    const objectUrlRevoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(
      makeAction({ kind: 'Download', urlTemplate: '/api/exports/parties.csv' }),
      null,
      null
    );
    await waitFor(() => expect(clickSpy).toHaveBeenCalledOnce());
    expect(objectUrlCreate).toHaveBeenCalled();
    expect(objectUrlRevoke).toHaveBeenCalledWith('blob:fake');
    createSpy.mockRestore();
  });
});
