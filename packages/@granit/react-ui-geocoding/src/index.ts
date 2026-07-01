// @granit/react-ui-geocoding — styled geocoding UI components.
// Composes the headless @granit/react-geocoding (provider + hooks) with the
// foundation @granit/react-ui primitives (Input, Spinner, Badge). Keeps
// @granit/react-geocoding pure headless (Option-b strict tiers).

// Components
export { AddressAutocompleteInput } from './components/address-autocomplete-input';
export type { AddressAutocompleteInputProps } from './components/address-autocomplete-input';
export { AddressPrecisionBadge } from './components/address-precision-badge';
export type { AddressPrecisionBadgeProps } from './components/address-precision-badge';

// Locales — the "geocoding" i18next namespace consumed by these components.
export { geocodingTranslationsEn, geocodingTranslationsFr } from './locales/index';

// Constants
export { I18N_NAMESPACE } from './constants';
