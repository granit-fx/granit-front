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
  display: EntityRelationManifest['display']
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
  };
}

const RESPONSE: RelationAggregatesResponse = {
  aggregates: {
    Invoices: { count: 12, sum: null, avg: null, min: null, max: null, currency: null },
    Tags: { count: 3, sum: null, avg: null, min: null, max: null, currency: null },
    AuditTrail: { count: 47, sum: null, avg: null, min: null, max: null, currency: null },
  },
};

let postCalls = 0;
let lastBody: unknown = null;

function freshHandlers() {
  return [
    http.post(PATH, async ({ request }) => {
      postCalls += 1;
      lastBody = await request.json();
      return HttpResponse.json(RESPONSE);
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  postCalls = 0;
  lastBody = null;
});
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

describe('EntityDetail Sidebar relations', () => {
  it('renders sidebar relations in the right rail', async () => {
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
    await waitFor(() =>
      expect(container.querySelector('[data-granit-detail-relation-sidebar]')).not.toBeNull()
    );
    const rail = container.querySelector('[data-granit-detail-rail]');
    expect(rail).not.toBeNull();
    expect(rail?.querySelector('[data-granit-detail-relation-sidebar]')).not.toBeNull();
  });

  it('shows the count after the response lands', async () => {
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
    await waitFor(() => {
      const count = container.querySelector(
        '[data-display="Sidebar"] [data-granit-relation-item-count]'
      );
      expect(count?.textContent).toBe('47');
    });
  });

  it('omits the rail when no sidebar relations and no side panels', () => {
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
    expect(container.querySelector('[data-granit-detail-rail]')).toBeNull();
  });
});

describe('EntityDetail InlineChips relations', () => {
  it('renders chips below the section column', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[relation('Tags', 0, 'InlineChips')]}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-detail-inline-chips]')).not.toBeNull()
    );
    const article = container.querySelector('[data-granit-entity-detail]') as HTMLElement;
    const sections = article.querySelector('[data-granit-detail-sections]') as HTMLElement;
    const chips = article.querySelector('[data-granit-detail-inline-chips]') as HTMLElement;
    expect(sections.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the count after the response lands', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[relation('Tags', 0, 'InlineChips')]}
        />
      </Wrapper>
    );
    await waitFor(() => {
      const count = container.querySelector(
        '[data-display="InlineChips"] [data-granit-relation-item-count]'
      );
      expect(count?.textContent).toBe('3');
    });
  });
});

describe('EntityDetail Tab relations', () => {
  it('renders tab relations at the top of the article, above SmartButtons', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[relation('Invoices', 0, 'SmartButton'), relation('Activities', 0, 'Tab')]}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-detail-tabs]')).not.toBeNull()
    );
    const tabs = container.querySelector('[data-granit-detail-tabs]') as HTMLElement;
    const smart = container.querySelector('[data-granit-detail-smart-buttons]') as HTMLElement;
    expect(tabs.compareDocumentPosition(smart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the count after the response lands', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[relation('Invoices', 0, 'Tab')]}
        />
      </Wrapper>
    );
    await waitFor(() => {
      const count = container.querySelector(
        '[data-display="Tab"] [data-granit-relation-item-count]'
      );
      expect(count?.textContent).toBe('12');
    });
  });

  it('forwards onRelationClick from a tab', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const onRelationClick = vi.fn();
    const tab = relation('Invoices', 0, 'Tab');
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[tab]}
          onRelationClick={onRelationClick}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-detail-tabs]')).not.toBeNull()
    );
    fireEvent.click(
      container.querySelector(
        '[data-display="Tab"] [data-granit-relation-item]'
      ) as HTMLButtonElement
    );
    expect(onRelationClick).toHaveBeenCalledWith(tab);
  });
});

describe('EntityDetail batched aggregates', () => {
  it('issues a single POST for every display mode (Tab + SmartButton + Sidebar + InlineChips) together', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[
            relation('Invoices', 0, 'SmartButton'),
            relation('AuditTrail', 0, 'Sidebar'),
            relation('Tags', 0, 'InlineChips'),
            relation('Activities', 0, 'Tab'),
          ]}
        />
      </Wrapper>
    );
    await waitFor(() => expect(postCalls).toBeGreaterThan(0));
    expect(postCalls).toBe(1);
    expect(lastBody).toEqual({
      relations: ['Activities', 'AuditTrail', 'Invoices', 'Tags'],
    });
  });

  it('fires onRelationClick for any display mode', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const onRelationClick = vi.fn();
    const tags = relation('Tags', 0, 'InlineChips');
    const auditTrail = relation('AuditTrail', 0, 'Sidebar');
    const { container } = render(
      <Wrapper>
        <EntityDetail
          variant={variant}
          values={{}}
          entityName={ENTITY}
          entityId={ID}
          relations={[tags, auditTrail]}
          onRelationClick={onRelationClick}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-detail-inline-chips]')).not.toBeNull()
    );

    fireEvent.click(
      container.querySelector(
        '[data-display="InlineChips"] [data-granit-relation-item]'
      ) as HTMLButtonElement
    );
    fireEvent.click(
      container.querySelector(
        '[data-display="Sidebar"] [data-granit-relation-item]'
      ) as HTMLButtonElement
    );

    expect(onRelationClick).toHaveBeenCalledTimes(2);
    expect(onRelationClick).toHaveBeenNthCalledWith(1, tags);
    expect(onRelationClick).toHaveBeenNthCalledWith(2, auditTrail);
  });
});
