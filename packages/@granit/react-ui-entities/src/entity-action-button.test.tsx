import { GranitClientProvider } from '@granit/react-api-client';
import { EntityRendererProvider, type EntityActionHandlers } from '@granit/react-entities';
import { mockEntityManifest, SAMPLE_ENTITY_ID } from '@granit/react-entities/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityActionButton } from './entity-action-button';
import { logger } from './logger';

import type { EntityActionManifest } from '@granit/entities';
import type { ReactNode } from 'react';

function makeAction(overrides: Partial<EntityActionManifest> = {}): EntityActionManifest {
  // Reuse the shared manifest fixture's action as the base descriptor and
  // override only the axes under test (kind / confirmationKey / labels).
  return { ...mockEntityManifest.actions![0]!, ...overrides };
}

function withProviders(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <EntityRendererProvider>{children}</EntityRendererProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
}

function renderButton(action: EntityActionManifest, actionHandlers?: EntityActionHandlers) {
  const result = render(
    withProviders(
      <EntityActionButton
        action={action}
        entityId={SAMPLE_ENTITY_ID}
        actionHandlers={actionHandlers}
      />
    )
  );
  const button = result.container.querySelector(
    '[data-slot="entity-action-button"]'
  ) as HTMLButtonElement;
  return { ...result, button };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EntityActionButton', () => {
  it.each([
    ['Download', 'outline', true],
    ['Navigate', 'outline', true],
    ['WorkflowTransitionResponse', 'default', true],
    ['OpenDrawer', 'outline', true],
    ['OpenModal', 'outline', true],
  ] as const)('maps kind %s to variant %s with an icon', (kind, variant, hasIcon) => {
    const { button } = renderButton(makeAction({ kind }));
    expect(button.getAttribute('data-variant')).toBe(variant);
    expect(button.getAttribute('data-action-kind')).toBe(kind);
    expect(button.querySelector('svg') !== null).toBe(hasIcon);
  });

  it('maps ApiCall with a confirmationKey to the destructive delete visual', () => {
    const { button } = renderButton(
      makeAction({ kind: 'ApiCall', confirmationKey: 'Confirm.Key' })
    );
    expect(button.getAttribute('data-variant')).toBe('destructive');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('maps ApiCall without a confirmationKey to the default variant and no icon', () => {
    const { button } = renderButton(makeAction({ kind: 'ApiCall', confirmationKey: null }));
    expect(button.getAttribute('data-variant')).toBe('default');
    expect(button.querySelector('svg')).toBeNull();
  });

  it('exposes the action name as a data attribute', () => {
    const { button } = renderButton(makeAction({ name: 'Approve' }));
    expect(button.getAttribute('data-action-name')).toBe('Approve');
  });

  it('resolves the label to the last segment of a dotted displayKey', () => {
    const { button } = renderButton(
      makeAction({ displayKey: 'Granit.Parties.Party.Action.Publish', name: 'Publish' })
    );
    expect(button.getAttribute('aria-label')).toBe('Publish');
    expect(button.getAttribute('title')).toBe('Publish');
    expect(button.textContent).toContain('Publish');
  });

  it('falls back to the action name when displayKey is null', () => {
    const { button } = renderButton(makeAction({ displayKey: null, name: 'Archive' }));
    expect(button.getAttribute('aria-label')).toBe('Archive');
    expect(button.textContent).toContain('Archive');
  });

  it('renders a default label when both displayKey and name are empty', () => {
    const { button } = renderButton(makeAction({ displayKey: null, name: '' }));
    // resolveLabel returns the empty name, so the `label || t(...)` fallback fires.
    expect(button.getAttribute('aria-label')).toBe('');
    expect(button.textContent?.length).toBeGreaterThan(0);
  });

  it('dispatches through the matching handler with the entity id on click', async () => {
    const apiCall = vi.fn().mockResolvedValue(undefined);
    const action = makeAction({ kind: 'ApiCall', confirmationKey: null });
    const { button } = renderButton(action, { apiCall });
    fireEvent.click(button);
    await waitFor(() => expect(apiCall).toHaveBeenCalledTimes(1));
    expect(apiCall).toHaveBeenCalledWith(action, SAMPLE_ENTITY_ID, null, expect.anything());
  });

  it('disables the button while the dispatch is pending and re-enables it after', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const apiCall = vi.fn(() => gate);
    const { button } = renderButton(makeAction({ kind: 'ApiCall', confirmationKey: null }), {
      apiCall,
    });
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    release();
    await waitFor(() => expect(button.disabled).toBe(false));
  });

  it('logs the error and re-enables the button when the dispatch rejects', async () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const failure = new Error('boom');
    const apiCall = vi.fn().mockRejectedValue(failure);
    const { button } = renderButton(
      makeAction({ kind: 'ApiCall', confirmationKey: null, name: 'Delete' }),
      {
        apiCall,
      }
    );
    fireEvent.click(button);
    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(1));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Delete'), failure);
    await waitFor(() => expect(button.disabled).toBe(false));
  });
});
