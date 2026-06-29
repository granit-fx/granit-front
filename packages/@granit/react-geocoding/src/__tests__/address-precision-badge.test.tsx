import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { beforeAll, describe, expect, it } from 'vitest';

import { AddressPrecisionBadge } from '../components/address-precision-badge';
import { geocodingTranslationsEn } from '../locales/en';

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: 'en',
      fallbackLng: 'en',
      ns: ['geocoding'],
      defaultNS: 'geocoding',
      resources: { en: { geocoding: geocodingTranslationsEn } },
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
});

function renderBadge(precision: 'Rooftop' | 'Street' | 'Locality') {
  return render(
    <I18nextProvider i18n={i18next}>
      <AddressPrecisionBadge precision={precision} />
    </I18nextProvider>
  );
}

describe('AddressPrecisionBadge', () => {
  it('renders the rooftop label as an exact location', () => {
    renderBadge('Rooftop');
    expect(screen.getByText(geocodingTranslationsEn.Precision.Rooftop)).toBeInTheDocument();
  });

  it('renders the locality label as an approximate location', () => {
    renderBadge('Locality');
    expect(screen.getByText(geocodingTranslationsEn.Precision.Locality)).toBeInTheDocument();
  });
});
