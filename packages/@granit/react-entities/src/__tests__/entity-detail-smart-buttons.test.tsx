import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EntityDetail } from '../components/entity-detail';
import { EntityRendererProvider } from '../providers/index';

import type {
  EntityDetailManifest,
  EntityRelationManifest,
  RelationAggregatesResponse,
} from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY = 'Granit.Parties.Party';
const ID = '8c6b1e10-0000-4000-8000-000000000001';
const PATH = `http://localhost/api/v1/entities/${encodeURIComponent(ENTITY)}/${encodeURIComponent(ID)}/relations/aggregates`;

const variant: EntityDetailManifest = {
  name: 'default',
  sections: [],
  sidePanels: [],
};

function relation(
  name: string,
  order: number,
  display: EntityRelationManifest['display'],
  overrides: Partial<EntityRelationManifest> = {}
): EntityRelationManifest {
  return {
    name,
    cardinality: 'Many',
    display,
    targetEntityName: `Granit.${name}`,
    displayKey: `Granit.${name}.Plural`,
    icon: null,
    order,
    queryDefinitionName: null,
    aggregates: [{ kind: 'Count', propertyName: null, labelKey: null, format: null }],
    contributorAssemblyName: null,
    ...overrides,
  };
}

const RESPONSE: RelationAggregatesResponse = {
  aggregates: {
    Invoices: { count: 12, sum: null, avg: null, min: null, max: null, currency: null },
    Payments: { count: 5, sum: null, avg: null, min: null, max: null, currency: null },
  },
};

function freshHandlers() {
  return [http.post(PATH, () => HttpResponse.json(RESPONSE))];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...freshHandlers()));
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <EntityRendererProvider>{children}</EntityRendererProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper };
}

describe('EntityDetail smart buttons', () => {
  it('renders one button per SmartButton relation, sorted by order', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[
            relation('Payments', 20, 'SmartButton'),
            relation('Invoices', 10, 'SmartButton'),
            relation('AuditTrail', 30, 'Sidebar'),
          ]}
        />
      </Wrapper>
    );
    const buttons = Array.from(container.querySelectorAll('[data-granit-smart-button]'));
    expect(buttons.map((b) => b.getAttribute('data-relation'))).toEqual(['Invoices', 'Payments']);
  });

  it('shows the loading dots before the aggregate response lands', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[relation('Invoices', 0, 'SmartButton')]}
        />
      </Wrapper>
    );
    const count = container.querySelector('[data-granit-relation-item-count]');
    expect(count?.textContent).toBe('…');
  });

  it('renders the count from the aggregate response', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[
            relation('Invoices', 0, 'SmartButton'),
            relation('Payments', 1, 'SmartButton'),
          ]}
        />
      </Wrapper>
    );
    await waitFor(() => {
      const counts = Array.from(
        container.querySelectorAll('[data-granit-relation-item-count]')
      ).map((el) => el.textContent);
      expect(counts).toEqual(['12', '5']);
    });
  });

  it('fires onRelationClick with the relation when a button is clicked', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const onRelationClick = vi.fn();
    const invoices = relation('Invoices', 0, 'SmartButton');
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[invoices]}
          onRelationClick={onRelationClick}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-smart-button]')).not.toBeNull()
    );
    fireEvent.click(container.querySelector('[data-granit-smart-button]') as HTMLButtonElement);
    expect(onRelationClick).toHaveBeenCalledWith(invoices);
  });

  it('disables the button when no onRelationClick is supplied', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[relation('Invoices', 0, 'SmartButton')]}
        />
      </Wrapper>
    );
    const button = container.querySelector('[data-granit-smart-button]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('omits the strip when no SmartButton relations exist', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[relation('AuditTrail', 0, 'Sidebar')]}
        />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-detail-smart-buttons]')).toBeNull();
  });

  it('omits the strip when entityName / entityId are missing', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          relations={[relation('Invoices', 0, 'SmartButton')]}
        />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-detail-smart-buttons]')).toBeNull();
  });
});
