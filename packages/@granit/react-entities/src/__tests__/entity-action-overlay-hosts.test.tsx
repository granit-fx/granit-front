import { GranitClientProvider } from '@granit/react-api-client';
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import {
  useEntityActionDrawer,
  useEntityActionModal,
} from '../actions/entity-action-overlay-context';
import { useEntityActionDispatcher } from '../actions/use-entity-action-dispatcher';
import { EntityActionDrawerHost } from '../components/entity-action-drawer-host';
import { EntityActionModalHost } from '../components/entity-action-modal-host';

import type { EntityActionManifest } from '@granit/entities';
import type { ReactNode } from 'react';

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

function makeWrapper() {
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return ({ children }: { children: ReactNode }) => (
    <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
  );
}

describe('EntityActionDrawerHost / useEntityActionDrawer', () => {
  it('starts with current = null and exposes open/close', () => {
    const Wrapper = makeWrapper();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Wrapper>
        <EntityActionDrawerHost>{children}</EntityActionDrawerHost>
      </Wrapper>
    );
    const { result } = renderHook(() => useEntityActionDrawer(), { wrapper });
    expect(result.current.current).toBeNull();
    act(() =>
      result.current.open({ action: makeAction({ kind: 'OpenDrawer' }), rowId: 'r1', row: null })
    );
    expect(result.current.current?.rowId).toBe('r1');
    act(() => result.current.close());
    expect(result.current.current).toBeNull();
  });

  it('throws when used outside <EntityActionDrawerHost>', () => {
    expect(() => renderHook(() => useEntityActionDrawer())).toThrow(/EntityActionDrawerHost/);
  });

  it('integration: dispatcher OpenDrawer pushes through the host context', () => {
    const Wrapper = makeWrapper();
    let captured: ReturnType<typeof useEntityActionDrawer> | null = null;
    function Probe() {
      captured = useEntityActionDrawer();
      return null;
    }
    function Trigger() {
      const dispatch = useEntityActionDispatcher();
      return (
        <button
          type="button"
          data-testid="trigger"
          onClick={() => {
            dispatch(makeAction({ kind: 'OpenDrawer', urlTemplate: null }), 'row-42', {
              id: 'row-42',
            }).catch(() => undefined);
          }}
        />
      );
    }
    const { container } = render(
      <Wrapper>
        <EntityActionDrawerHost>
          <Probe />
          <Trigger />
        </EntityActionDrawerHost>
      </Wrapper>
    );
    expect(captured!.current).toBeNull();
    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement);
    expect(captured!.current?.rowId).toBe('row-42');
    expect(captured!.current?.action.kind).toBe('OpenDrawer');
  });
});

describe('EntityActionModalHost / useEntityActionModal', () => {
  it('starts with current = null and exposes open/close', () => {
    const Wrapper = makeWrapper();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Wrapper>
        <EntityActionModalHost>{children}</EntityActionModalHost>
      </Wrapper>
    );
    const { result } = renderHook(() => useEntityActionModal(), { wrapper });
    expect(result.current.current).toBeNull();
    act(() =>
      result.current.open({ action: makeAction({ kind: 'OpenModal' }), rowId: 'm1', row: null })
    );
    expect(result.current.current?.rowId).toBe('m1');
  });

  it('throws when used outside <EntityActionModalHost>', () => {
    expect(() => renderHook(() => useEntityActionModal())).toThrow(/EntityActionModalHost/);
  });

  it('integration: dispatcher OpenModal pushes through the host context (URL-fallback case)', () => {
    const Wrapper = makeWrapper();
    let captured: ReturnType<typeof useEntityActionModal> | null = null;
    function Probe() {
      captured = useEntityActionModal();
      return null;
    }
    function Trigger() {
      const dispatch = useEntityActionDispatcher();
      return (
        <button
          type="button"
          data-testid="trigger"
          onClick={() => {
            dispatch(
              makeAction({ kind: 'OpenModal', urlTemplate: '/import?ids=…' }),
              null,
              null
            ).catch(() => undefined);
          }}
        />
      );
    }
    const { container } = render(
      <Wrapper>
        <EntityActionModalHost>
          <Probe />
          <Trigger />
        </EntityActionModalHost>
      </Wrapper>
    );
    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement);
    expect(captured!.current?.action.urlTemplate).toBe('/import?ids=…');
  });
});
