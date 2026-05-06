import { GranitClientProvider } from '@granit/react-api-client';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  EntitySelectionBar,
  fanOutWithCap,
  SELECTION_FANOUT_CONCURRENCY_CAP,
} from '../components/entity-selection-bar.js';
import { SelectionContext, useSelection } from '../selection/selection-context.js';
import { SelectionProvider } from '../selection/selection-provider.js';

import type {
  EntityActionManifest,
  EntityManifestResponse,
  EntitySelectionActionManifest,
} from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY_NAME = 'Granit.Parties.Party';

function makeAction(overrides: Partial<EntityActionManifest> = {}): EntityActionManifest {
  return {
    name: 'archive',
    kind: 'ApiCall',
    displayKey: 'Parties.Action.Archive',
    icon: 'archive',
    order: 0,
    urlTemplate: '/api/parties/{id}/archive',
    httpMethod: 'POST',
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
    ...overrides,
  };
}

function makeManifest(args: {
  selectionActions: readonly EntitySelectionActionManifest[];
  actions: readonly EntityActionManifest[] | null;
}): EntityManifestResponse {
  return {
    schemaVersion: 1,
    identity: {
      name: ENTITY_NAME,
      entityClrType: 'Granit.Parties.Domain.Party',
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
      selectionActions: args.selectionActions,
    },
    relations: null,
    actions: args.actions,
  };
}

function makeWrapper() {
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return ({ children }: { children: ReactNode }) => (
    <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// SelectionProvider + useSelection
// ---------------------------------------------------------------------------

describe('useSelection', () => {
  it('returns a no-op default outside a provider', () => {
    const { result } = renderHook(() => useSelection());
    expect(result.current.size).toBe(0);
    expect(result.current.mode).toBe('explicit');
    expect(() => result.current.toggle('a')).not.toThrow();
  });

  it('toggles ids on/off via the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SelectionProvider>{children}</SelectionProvider>
    );
    const { result } = renderHook(() => useSelection(), { wrapper });
    expect(result.current.size).toBe(0);
    act(() => result.current.toggle('a'));
    expect(result.current.size).toBe(1);
    expect(result.current.selectedIds.has('a')).toBe(true);
    act(() => result.current.toggle('b'));
    expect(result.current.size).toBe(2);
    act(() => result.current.toggle('a'));
    expect(result.current.size).toBe(1);
    expect(result.current.selectedIds.has('a')).toBe(false);
  });

  it('replaces and clears the selection', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SelectionProvider initialSelectedIds={['x']}>{children}</SelectionProvider>
    );
    const { result } = renderHook(() => useSelection(), { wrapper });
    expect(result.current.size).toBe(1);
    act(() => result.current.setSelected(['p', 'q', 'r']));
    expect(result.current.size).toBe(3);
    act(() => result.current.clear());
    expect(result.current.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// fanOutWithCap helper
// ---------------------------------------------------------------------------

describe('fanOutWithCap', () => {
  it('respects the concurrency cap (never more than `cap` in-flight)', async () => {
    const ids = Array.from({ length: 25 }, (_, i) => `id-${i}`);
    let inFlight = 0;
    let peak = 0;
    const recap = await fanOutWithCap(
      ids,
      async (id) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise<void>((resolve) => setTimeout(resolve, 5));
        inFlight -= 1;
        return { kind: 'ok', id };
      },
      4
    );
    expect(peak).toBeLessThanOrEqual(4);
    expect(recap.succeeded).toHaveLength(25);
    expect(recap.failed).toHaveLength(0);
  });

  it('captures err results without short-circuiting', async () => {
    const ids = ['a', 'b', 'c', 'd'];
    const recap = await fanOutWithCap(
      ids,
      async (id) =>
        id === 'b' || id === 'd'
          ? { kind: 'err', id, error: new Error('nope') }
          : { kind: 'ok', id },
      2
    );
    expect(recap.succeeded.sort()).toEqual(['a', 'c']);
    expect(recap.failed.map((f) => f.id).sort()).toEqual(['b', 'd']);
  });

  it('exposes the concurrency cap constant at 10', () => {
    expect(SELECTION_FANOUT_CONCURRENCY_CAP).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// EntitySelectionBar
// ---------------------------------------------------------------------------

describe('EntitySelectionBar', () => {
  it('renders nothing when the manifest declares no selectionActions', () => {
    const Wrapper = makeWrapper();
    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['a']}>
          <EntitySelectionBar manifest={makeManifest({ selectionActions: [], actions: [] })} />
        </SelectionProvider>
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-entity-selection-bar]')).toBeNull();
  });

  it('renders nothing when nothing is selected, even if the manifest has selectionActions', () => {
    const Wrapper = makeWrapper();
    const { container } = render(
      <Wrapper>
        <SelectionProvider>
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: 'Parties.Action.Archive',
                  icon: 'archive',
                  confirmationKey: null,
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
          />
        </SelectionProvider>
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-entity-selection-bar]')).toBeNull();
  });

  it('shows the bar with metadata data-attrs when selection is non-empty', () => {
    const Wrapper = makeWrapper();
    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['a', 'b', 'c']}>
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: 'Parties.Action.Archive',
                  icon: 'archive',
                  confirmationKey: null,
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
          />
        </SelectionProvider>
      </Wrapper>
    );
    const bar = container.querySelector('[data-granit-entity-selection-bar]') as HTMLElement;
    expect(bar.getAttribute('data-entity')).toBe(ENTITY_NAME);
    expect(bar.getAttribute('data-selected-count')).toBe('3');
    const button = container.querySelector('[data-granit-entity-action]') as HTMLElement;
    expect(button.getAttribute('data-action-name')).toBe('archive');
    expect(button.getAttribute('data-action-kind')).toBe('ApiCall');
  });

  it('fans out the action across selected ids and surfaces a recap on completion', async () => {
    const Wrapper = makeWrapper();
    const dispatched: string[] = [];
    const apiCall = vi.fn(async (_action, rowId: string | null) => {
      dispatched.push(rowId ?? '<null>');
    });
    const onComplete = vi.fn();
    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['p1', 'p2', 'p3']}>
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: null,
                  icon: 'archive',
                  confirmationKey: null,
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
            handlers={{ apiCall }}
            onComplete={onComplete}
          />
        </SelectionProvider>
      </Wrapper>
    );
    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(dispatched.sort()).toEqual(['p1', 'p2', 'p3']);
    const recap = onComplete.mock.calls[0]?.[1];
    expect(recap.succeeded.sort()).toEqual(['p1', 'p2', 'p3']);
    expect(recap.failed).toHaveLength(0);
  });

  it('partitions succeeded vs. failed in the recap when some calls reject', async () => {
    const Wrapper = makeWrapper();
    const apiCall = vi.fn(async (_action, rowId: string | null) => {
      if (rowId === 'p2') throw new Error('boom');
    });
    const onComplete = vi.fn();
    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['p1', 'p2', 'p3']}>
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: null,
                  icon: null,
                  confirmationKey: null,
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
            handlers={{ apiCall }}
            onComplete={onComplete}
          />
        </SelectionProvider>
      </Wrapper>
    );
    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    const recap = onComplete.mock.calls[0]?.[1];
    expect(recap.succeeded.sort()).toEqual(['p1', 'p3']);
    expect(recap.failed.map((f: { id: string }) => f.id)).toEqual(['p2']);
  });

  it('confirms via globalThis.confirm when confirmationKey is set and short-circuits on cancel', () => {
    const Wrapper = makeWrapper();
    const confirmStub = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    const apiCall = vi.fn();
    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['p1']}>
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: null,
                  icon: null,
                  confirmationKey: 'Parties.Confirm.BulkArchive',
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
            handlers={{ apiCall }}
          />
        </SelectionProvider>
      </Wrapper>
    );
    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    expect(confirmStub).toHaveBeenCalledWith('Parties.Confirm.BulkArchive');
    expect(apiCall).not.toHaveBeenCalled();
  });

  it('honors a custom confirm slot and aborts when it returns false', async () => {
    const Wrapper = makeWrapper();
    const confirm = vi.fn(async () => false);
    const apiCall = vi.fn();
    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['p1', 'p2']}>
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: null,
                  icon: null,
                  confirmationKey: 'Parties.Confirm.BulkArchive',
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
            handlers={{ apiCall }}
            confirm={confirm}
          />
        </SelectionProvider>
      </Wrapper>
    );
    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(apiCall).not.toHaveBeenCalled();
  });

  it('clears the selection on full success and keeps failed ids selected', async () => {
    const Wrapper = makeWrapper();
    const apiCall = vi.fn(async (_action, rowId: string | null) => {
      if (rowId === 'p2') throw new Error('nope');
    });
    let observedSize = -1;
    function ObserveSelection() {
      const sel = useSelection();
      observedSize = sel.size;
      return null;
    }
    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['p1', 'p2']}>
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: null,
                  icon: null,
                  confirmationKey: null,
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
            handlers={{ apiCall }}
          />
          <ObserveSelection />
        </SelectionProvider>
      </Wrapper>
    );
    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    await waitFor(() => expect(observedSize).toBe(1));
  });
});

// ---------------------------------------------------------------------------
// Selection-aware UI integrated with mounted SelectionContext
// ---------------------------------------------------------------------------

describe('SelectionContext + EntitySelectionBar interplay', () => {
  it('clear-selection button drops the size to 0', () => {
    const Wrapper = makeWrapper();
    let observedSize = -1;
    function Observe() {
      const sel = useSelection();
      observedSize = sel.size;
      return null;
    }
    const { container } = render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['p1', 'p2']}>
          <Observe />
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: null,
                  icon: null,
                  confirmationKey: null,
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
          />
        </SelectionProvider>
      </Wrapper>
    );
    expect(observedSize).toBe(2);
    fireEvent.click(container.querySelector('[data-granit-selection-bar-clear]') as HTMLElement);
    expect(observedSize).toBe(0);
  });

  it('uses an external SelectionContext value when SelectionProvider is replaced', () => {
    const noOp = (): void => undefined;
    const externalCtx = {
      selectedIds: new Set(['ext-1']),
      mode: 'explicit' as const,
      size: 1,
      toggle: noOp,
      setSelected: noOp,
      clear: noOp,
    };
    const Wrapper = makeWrapper();
    const { container } = render(
      <Wrapper>
        <SelectionContext.Provider value={externalCtx}>
          <EntitySelectionBar
            manifest={makeManifest({
              selectionActions: [
                {
                  name: 'archive',
                  displayKey: null,
                  icon: null,
                  confirmationKey: null,
                  contributorAssemblyName: null,
                },
              ],
              actions: [makeAction()],
            })}
          />
        </SelectionContext.Provider>
      </Wrapper>
    );
    const bar = container.querySelector('[data-granit-entity-selection-bar]') as HTMLElement;
    expect(bar.getAttribute('data-selected-count')).toBe('1');
  });
});
