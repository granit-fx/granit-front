import { GranitClientProvider } from '@granit/react-api-client';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityActionModalContext } from '../actions/entity-action-overlay-context';
import { useEntityActionDispatcher } from '../actions/use-entity-action-dispatcher';

import type { EntityActionManifest } from '@granit/entities';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Branch-coverage backfill for useEntityActionDispatcher. The base suite drives
// the host-context + warn paths and the happy ApiCall / Download / Navigate.
// This file targets the remaining arms: the explicit handler overrides for
// OpenDrawer / OpenModal, the no-op guards in the default ApiCall / Download /
// Navigate handlers (missing urlTemplate / httpMethod), and the
// Content-Disposition / filename-derivation branches of the default download.
// ---------------------------------------------------------------------------

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

describe('useEntityActionDispatcher — handler overrides', () => {
  it('OpenDrawer delegates to the openDrawer handler override when supplied', async () => {
    const openDrawer = vi.fn();
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher({ openDrawer }), { wrapper });
    const action = makeAction({ kind: 'OpenDrawer' });
    await result.current(action, 'abc', { id: 'abc' });
    expect(openDrawer).toHaveBeenCalledOnce();
    expect(openDrawer).toHaveBeenCalledWith(action, 'abc', { id: 'abc' }, expect.anything());
  });

  it('OpenModal prefers the openModal override even when a modal host is mounted', async () => {
    const openModal = vi.fn();
    const modalStub = { open: vi.fn(), close: vi.fn(), current: null };
    const { wrapper: BaseWrapper } = makeWrapper();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <BaseWrapper>
        <EntityActionModalContext.Provider value={modalStub}>
          {children}
        </EntityActionModalContext.Provider>
      </BaseWrapper>
    );
    const { result } = renderHook(() => useEntityActionDispatcher({ openModal }), { wrapper });
    await result.current(makeAction({ kind: 'OpenModal' }), 'abc', null);
    expect(openModal).toHaveBeenCalledOnce();
    expect(modalStub.open).not.toHaveBeenCalled();
  });
});

describe('default handlers — no-op guards', () => {
  it('ApiCall is a no-op when urlTemplate / httpMethod are missing', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    // No urlTemplate and no httpMethod → early return, no unhandled request (msw would 500).
    await expect(
      result.current(makeAction({ kind: 'ApiCall' }), 'abc', null)
    ).resolves.toBeUndefined();
  });

  it('Download is a no-op when urlTemplate is missing', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await expect(
      result.current(makeAction({ kind: 'Download', urlTemplate: null }), null, null)
    ).resolves.toBeUndefined();
  });

  it('Navigate is a no-op when urlTemplate is missing', async () => {
    const hrefHolder = { href: 'about:blank' };
    Object.defineProperty(globalThis, 'location', {
      value: hrefHolder,
      configurable: true,
      writable: true,
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(makeAction({ kind: 'Navigate', urlTemplate: null }), null, null);
    expect(hrefHolder.href).toBe('about:blank');
  });
});

describe('default download — filename derivation', () => {
  function stubAnchor() {
    const clickSpy = vi.fn();
    const realCreate = globalThis.document.createElement.bind(globalThis.document);
    vi.spyOn(globalThis.document, 'createElement').mockImplementation(((tagName: string) => {
      const node = realCreate(tagName) as HTMLElement;
      if (tagName === 'a') node.click = clickSpy;
      return node;
    }) as typeof globalThis.document.createElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    return { clickSpy };
  }

  it('derives the filename from the URL last segment when no Content-Disposition header is present', async () => {
    server.use(
      // No Content-Disposition header at all → readFilename returns null → URL fallback.
      http.get('http://localhost/api/exports/report.pdf', () => HttpResponse.text('pdf-bytes'))
    );
    const { clickSpy } = stubAnchor();
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(
      makeAction({ kind: 'Download', urlTemplate: '/api/exports/report.pdf?token=xyz' }),
      null,
      null
    );
    await waitFor(() => expect(clickSpy).toHaveBeenCalledOnce());
  });

  it('falls back to "download" when the URL has no usable last segment', async () => {
    server.use(http.get('http://localhost/', () => HttpResponse.text('root-bytes')));
    const { clickSpy } = stubAnchor();
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityActionDispatcher(), { wrapper });
    await result.current(makeAction({ kind: 'Download', urlTemplate: '/' }), null, null);
    await waitFor(() => expect(clickSpy).toHaveBeenCalledOnce());
  });
});
