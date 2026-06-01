import { GranitClientProvider } from '@granit/react-api-client';
import { fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { EntityListPageHeader } from '../components/entity-list-page-header';

import type {
  EntityActionManifest,
  EntityHeaderActionManifest,
  EntityManifestResponse,
} from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY_NAME = 'Granit.Parties.Party';

function makeAction(overrides: Partial<EntityActionManifest> = {}): EntityActionManifest {
  return {
    name: 'import',
    kind: 'Navigate',
    displayKey: 'Parties.Action.Import',
    icon: 'upload',
    order: 0,
    urlTemplate: '/import?entity=Party',
    httpMethod: null,
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
    ...overrides,
  };
}

function makeManifest(args: {
  headerActions: readonly EntityHeaderActionManifest[];
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
      headerActions: args.headerActions,
      selectionActions: [],
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

describe('EntityListPageHeader', () => {
  it('renders nothing when the manifest declares no header actions', () => {
    const Wrapper = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityListPageHeader manifest={makeManifest({ headerActions: [], actions: [] })} />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-entity-list-page-header]')).toBeNull();
  });

  it('renders one button per resolved header action with metadata data-attrs', () => {
    const Wrapper = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityListPageHeader
          manifest={makeManifest({
            headerActions: [
              {
                name: 'import',
                displayKey: 'Parties.Action.Import',
                icon: 'upload',
                contributorAssemblyName: null,
              },
              {
                name: 'export',
                displayKey: 'Parties.Action.Export',
                icon: 'download',
                contributorAssemblyName: null,
              },
            ],
            actions: [
              makeAction({ name: 'import', icon: 'upload', urlTemplate: '/import' }),
              makeAction({
                name: 'export',
                kind: 'Download',
                icon: 'download',
                urlTemplate: '/exports/parties.csv',
              }),
            ],
          })}
        />
      </Wrapper>
    );
    const buttons = container.querySelectorAll('[data-granit-entity-action]');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.getAttribute('data-action-name')).toBe('import');
    expect(buttons[0]?.getAttribute('data-action-kind')).toBe('Navigate');
    expect(buttons[0]?.getAttribute('data-action-icon')).toBe('upload');
    expect(buttons[0]?.getAttribute('data-display-key')).toBe('Parties.Action.Import');
    expect(buttons[1]?.getAttribute('data-action-kind')).toBe('Download');
  });

  it('skips compact references that do not resolve in the actions facet', () => {
    const Wrapper = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityListPageHeader
          manifest={makeManifest({
            headerActions: [
              {
                name: 'import',
                displayKey: null,
                icon: null,
                contributorAssemblyName: null,
              },
              {
                name: 'orphan',
                displayKey: null,
                icon: null,
                contributorAssemblyName: null,
              },
            ],
            actions: [makeAction({ name: 'import' })],
          })}
        />
      </Wrapper>
    );
    expect(container.querySelectorAll('[data-granit-entity-action]')).toHaveLength(1);
  });

  it('dispatches Navigate via the custom navigate handler on click', () => {
    const navigate = vi.fn();
    const Wrapper = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityListPageHeader
          manifest={makeManifest({
            headerActions: [
              {
                name: 'import',
                displayKey: null,
                icon: null,
                contributorAssemblyName: null,
              },
            ],
            actions: [makeAction({ name: 'import', urlTemplate: '/import?entity=Party' })],
          })}
          handlers={{ navigate }}
        />
      </Wrapper>
    );
    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'import' }),
      null,
      null,
      expect.anything()
    );
  });
});
