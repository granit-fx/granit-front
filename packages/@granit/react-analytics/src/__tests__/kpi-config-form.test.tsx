import { Datasource } from '@granit/dashboards';
import { fireEvent, render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { KpiConfigForm } from '../editor/kpi-config-form.js';

import type { KpiWidgetDefinition } from '@granit/analytics';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode) {
  return render(<I18nextProvider i18n={testI18n}>{node}</I18nextProvider>);
}

const baseKpi: KpiWidgetDefinition = {
  slug: 'K',
  type: 'kpi',
  position: 0,
  size: { width: 3, height: 1 },
  datasource: Datasource.metric('Granit.Test.Metric'),
};

describe('KpiConfigForm', () => {
  it('shows the metric-name input when bound to a metric datasource', () => {
    const { container } = wrap(<KpiConfigForm widget={baseKpi} onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="kpi-metric-name"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="kpi-query-name"]')).toBeNull();
  });

  it('emits an updated metric-name on change', () => {
    const onChange = vi.fn();
    const { container } = wrap(<KpiConfigForm widget={baseKpi} onChange={onChange} />);
    const input = container.querySelector('[data-slot="kpi-metric-name"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: 'Granit.Test.NewMetric' } });
    expect(onChange.mock.calls[0]?.[0]?.datasource).toEqual(
      Datasource.metric('Granit.Test.NewMetric')
    );
  });

  it('switches to query-aggregate when the kind selector changes', () => {
    const onChange = vi.fn();
    const { container } = wrap(<KpiConfigForm widget={baseKpi} onChange={onChange} />);
    const select = container.querySelector('[data-slot="kpi-datasource-kind"]');
    if (!(select instanceof HTMLSelectElement)) throw new Error('select not found');
    fireEvent.change(select, { target: { value: 'query-aggregate' } });
    expect(onChange.mock.calls[0]?.[0]?.datasource?.kind).toBe('query-aggregate');
  });

  it('shows query-name + aggregation inputs when bound to query-aggregate', () => {
    const queryKpi: KpiWidgetDefinition = {
      ...baseKpi,
      datasource: Datasource.queryAggregate('Granit.Test.Query', 'Sum'),
    };
    const { container } = wrap(<KpiConfigForm widget={queryKpi} onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="kpi-query-name"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="kpi-aggregation"]')).not.toBeNull();
  });
});
