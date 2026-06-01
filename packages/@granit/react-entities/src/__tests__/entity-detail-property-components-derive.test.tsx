import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import { EntityDetail } from '../components/entity-detail';
import { STANDARD_DETAIL_COMPONENTS } from '../field-components/standard-detail-components';
import { EntityRendererProvider } from '../providers/index';

import type {
  EntityDetailManifest,
  EntityFormFieldManifest,
  EntityFormManifest,
} from '@granit/entities';
import type { ReactNode } from 'react';

function withProvider(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <EntityRendererProvider
          components={{ form: {}, detail: STANDARD_DETAIL_COMPONENTS.detail }}
        >
          {children}
        </EntityRendererProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
}

const detailVariant: EntityDetailManifest = {
  name: 'default',
  sections: [
    {
      key: 'main',
      labelKey: null,
      order: 0,
      inheritsFromFormVariant: null,
      fields: ['Website', 'Email', 'Phone', 'Notes'],
    },
  ],
  sidePanels: [],
};

function field(
  propertyName: string,
  component: string,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName: 'String',
    component,
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    ...overrides,
  };
}

function formVariant(name: string, fields: EntityFormFieldManifest[]): EntityFormManifest {
  return {
    name,
    customizable: false,
    sections: [{ key: 'main', labelKey: null, order: 0, collapsedByDefault: false, fields }],
  };
}

describe('EntityDetail — propertyComponents auto-derive from formVariants', () => {
  it('derives the component for free-form section properties from supplied form variants', () => {
    const formVariants = [
      formVariant('default', [
        field('Website', 'url'),
        field('Email', 'email'),
        field('Phone', 'tel'),
        field('Notes', 'textarea'),
      ]),
    ];
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={detailVariant}
          values={{
            Website: 'https://example.com',
            Email: 'a@b',
            Phone: '+32 1',
            Notes: 'plain',
          }}
          formVariants={formVariants}
        />
      )
    );

    const websiteLink = container.querySelector('[data-property="Website"] a');
    expect(websiteLink?.getAttribute('href')).toBe('https://example.com');
    const emailLink = container.querySelector('[data-property="Email"] a');
    expect(emailLink?.getAttribute('href')).toBe('mailto:a@b');
    const phoneLink = container.querySelector('[data-property="Phone"] a');
    expect(phoneLink?.getAttribute('href')).toBe('tel:+321');
  });

  it('explicit propertyComponents merges on top of the auto-derived map (per-key override)', () => {
    const formVariants = [
      formVariant('default', [field('Website', 'text'), field('Email', 'email')]),
    ];
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={detailVariant}
          values={{ Website: 'https://example.com', Email: 'a@b' }}
          formVariants={formVariants}
          propertyComponents={{ Website: 'url' }} // override only Website
        />
      )
    );

    // Website overridden to url → renders as <a>
    const websiteLink = container.querySelector('[data-property="Website"] a');
    expect(websiteLink?.getAttribute('href')).toBe('https://example.com');
    // Email not overridden → still picks up auto-derived 'email' component
    const emailLink = container.querySelector('[data-property="Email"] a');
    expect(emailLink?.getAttribute('href')).toBe('mailto:a@b');
  });

  it('explicit propertyComponents without formVariants still works (no auto-derive)', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={detailVariant}
          values={{ Website: 'https://example.com' }}
          propertyComponents={{ Website: 'url' }}
        />
      )
    );
    const websiteLink = container.querySelector('[data-property="Website"] a');
    expect(websiteLink?.getAttribute('href')).toBe('https://example.com');
  });

  it('falls back to text formatter when neither formVariants nor propertyComponents supplied', () => {
    const { container } = render(
      withProvider(
        <EntityDetail variant={detailVariant} values={{ Website: 'https://example.com' }} />
      )
    );
    const dd = container.querySelector('[data-property="Website"] dd');
    expect(dd?.textContent).toBe('https://example.com');
    expect(dd?.querySelector('a')).toBeNull();
  });

  it('later form variants override earlier ones for the same property name', () => {
    const formVariants = [
      formVariant('compact', [field('Website', 'text')]),
      formVariant('full', [field('Website', 'url')]),
    ];
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={detailVariant}
          values={{ Website: 'https://example.com' }}
          formVariants={formVariants}
        />
      )
    );
    // 'full' wins → Website renders as URL link
    const websiteLink = container.querySelector('[data-property="Website"] a');
    expect(websiteLink).not.toBeNull();
    expect(websiteLink?.getAttribute('href')).toBe('https://example.com');
  });
});
