import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import { EntityDetail } from '../components/entity-detail.js';
import { STANDARD_DETAIL_COMPONENTS } from '../field-components/standard-detail-components.js';
import { EntityRendererProvider } from '../provider/index.js';

import type {
  EntityDetailManifest,
  EntityFormFieldManifest,
  EntityFormManifest,
} from '@granit/entities';
import type { ReactNode } from 'react';

function withProvider(children: ReactNode, detail = STANDARD_DETAIL_COMPONENTS.detail) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <EntityRendererProvider components={{ form: {}, detail }}>
          {children}
        </EntityRendererProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
}

function freeForm(...fields: string[]): EntityDetailManifest {
  return {
    name: 'default',
    sections: [
      {
        key: 'main',
        labelKey: null,
        order: 0,
        inheritsFromFormVariant: null,
        fields,
      },
    ],
    sidePanels: [],
  };
}

function inherited(formVariant: string): EntityDetailManifest {
  return {
    name: 'default',
    sections: [
      {
        key: 'main',
        labelKey: null,
        order: 0,
        inheritsFromFormVariant: formVariant,
        fields: null,
      },
    ],
    sidePanels: [],
  };
}

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

function formVariantWith(name: string, fields: EntityFormFieldManifest[]): EntityFormManifest {
  return {
    name,
    customizable: false,
    sections: [{ key: 'main', labelKey: null, order: 0, collapsedByDefault: false, fields }],
  };
}

describe('STANDARD_DETAIL_COMPONENTS — url widget', () => {
  it('renders an external URL with target=_blank rel=noreferrer', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={freeForm('Website')}
          values={{ Website: 'https://example.com' }}
          propertyComponents={{ Website: 'url' }}
        />
      )
    );
    const link = container.querySelector('[data-property="Website"] a') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noreferrer');
    expect(link.getAttribute('data-external')).toBe('');
    expect(link.textContent).toBe('https://example.com');
  });

  it('renders an internal URL in-tab (no target / rel)', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={freeForm('Website')}
          values={{ Website: '/parties/42' }}
          propertyComponents={{ Website: 'url' }}
        />
      )
    );
    const link = container.querySelector('[data-property="Website"] a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/parties/42');
    expect(link.hasAttribute('target')).toBe(false);
    expect(link.hasAttribute('rel')).toBe(false);
    expect(link.hasAttribute('data-external')).toBe(false);
  });

  it('falls back to em-dash when value is null / empty', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={freeForm('Website')}
          values={{ Website: null }}
          propertyComponents={{ Website: 'url' }}
        />
      )
    );
    const dd = container.querySelector('[data-property="Website"] dd');
    expect(dd?.textContent).toBe('—');
    expect(dd?.querySelector('a')).toBeNull();
  });
});

describe('STANDARD_DETAIL_COMPONENTS — email widget', () => {
  it('renders a mailto: link', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={freeForm('Email')}
          values={{ Email: 'jane@example.com' }}
          propertyComponents={{ Email: 'email' }}
        />
      )
    );
    const link = container.querySelector('[data-property="Email"] a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('mailto:jane@example.com');
    expect(link.getAttribute('data-scheme')).toBe('mailto');
  });
});

describe('STANDARD_DETAIL_COMPONENTS — tel widget', () => {
  it('renders a tel: link with whitespace stripped from the href', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={freeForm('Phone')}
          values={{ Phone: '+32 471 23 45 67' }}
          propertyComponents={{ Phone: 'tel' }}
        />
      )
    );
    const link = container.querySelector('[data-property="Phone"] a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('tel:+32471234567');
    expect(link.getAttribute('data-scheme')).toBe('tel');
    // Display label keeps the human-readable spacing.
    expect(link.textContent).toBe('+32 471 23 45 67');
  });
});

describe('EntityDetail — propertyComponents free-form fallback', () => {
  it('falls back to text formatter when widget id not in catalog', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={freeForm('Mystery')}
          values={{ Mystery: 'just text' }}
          propertyComponents={{ Mystery: 'unknown-widget' }}
        />
      )
    );
    const dd = container.querySelector('[data-property="Mystery"] dd');
    expect(dd?.textContent).toBe('just text');
    expect(dd?.querySelector('a')).toBeNull();
  });

  it('falls back to text when no widget is mapped for the property', () => {
    const { container } = render(
      withProvider(<EntityDetail variant={freeForm('Notes')} values={{ Notes: 'plain' }} />)
    );
    const dd = container.querySelector('[data-property="Notes"] dd');
    expect(dd?.textContent).toBe('plain');
  });

  it('em-dash for null in default text mode', () => {
    const { container } = render(
      withProvider(<EntityDetail variant={freeForm('Notes')} values={{}} />)
    );
    const dd = container.querySelector('[data-property="Notes"] dd');
    expect(dd?.textContent).toBe('—');
  });
});

describe('EntityDetail — inherited mode reads field.component', () => {
  it('uses the form field widget id to look up the detail widget', () => {
    const variant = inherited('default');
    const formVariants = [formVariantWith('default', [field('Website', 'url')])];
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={variant}
          values={{ Website: 'https://example.com' }}
          formVariants={formVariants}
        />
      )
    );
    const link = container.querySelector('[data-property="Website"] a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('falls back to text formatter when the field widget id is unknown', () => {
    const variant = inherited('default');
    const formVariants = [formVariantWith('default', [field('Notes', 'text')])];
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={variant}
          values={{ Notes: 'plain text' }}
          formVariants={formVariants}
        />
      )
    );
    const dd = container.querySelector('[data-property="Notes"] dd');
    // STANDARD_DETAIL_COMPONENTS maps 'text' → text formatter, so it renders plainly.
    expect(dd?.textContent).toBe('plain text');
    expect(dd?.querySelector('a')).toBeNull();
  });
});
