import { GranitClientProvider } from '@granit/react-api-client';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import { EntitySelectionBar } from '../components/entity-selection-bar.js';
import { SelectionProvider } from '../selection/selection-provider.js';

import type {
  EntityActionManifest,
  EntityManifestResponse,
  EntitySelectionActionManifest,
} from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY_NAME = 'Granit.Sales.Quote';

function makeAction(): EntityActionManifest {
  return {
    name: 'archive',
    kind: 'ApiCall',
    displayKey: null,
    icon: null,
    order: 0,
    urlTemplate: '/api/quotes/{id}/archive',
    httpMethod: 'POST',
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
  };
}

function makeRef(): EntitySelectionActionManifest {
  return {
    name: 'archive',
    displayKey: null,
    icon: null,
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

describe('<EntitySelectionBar> — labels', () => {
  it('renders the English defaults when no labels prop is supplied', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['q1', 'q2', 'q3']}>
          <EntitySelectionBar manifest={makeManifest()} />
        </SelectionProvider>
      </Wrapper>
    );
    expect(screen.getByText('3 selected')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDefined();
  });

  it('honors selectedSummary + clearSelection overrides (e.g. wired from t())', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <SelectionProvider initialSelectedIds={['q1', 'q2']}>
          <EntitySelectionBar
            manifest={makeManifest()}
            labels={{
              selectedSummary: (n) => `${n} sélectionnés`,
              clearSelection: 'Effacer la sélection',
            }}
          />
        </SelectionProvider>
      </Wrapper>
    );
    expect(screen.getByText('2 sélectionnés')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Effacer la sélection' })).toBeDefined();
  });
});
