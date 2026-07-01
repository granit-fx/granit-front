# @granit/react-ui-geocoding

Styled **UI feature kit** for the geocoding module — the **rendering** layer that
composes the headless [`@granit/react-geocoding`](../react-geocoding) (provider +
hooks) with the foundation [`@granit/react-ui`](../react-ui) primitives (`Input`,
`Spinner`, `Badge`). It owns no DTOs, HTTP calls, or query keys — those live one
and two layers down.

The split is three packages over the same `Granit.Geocoding` backend:

- [`@granit/geocoding`](../geocoding) — framework-agnostic core: DTOs
  (`GeocodingSuggestionResponse`, `GeocodeMatchPrecision`) and Axios functions.
- [`@granit/react-geocoding`](../react-geocoding) — headless React Query hooks
  (`useAddressSuggestions`, `useReverseGeocode`) + `GeocodingProvider`. No
  `@granit/react-ui` import.
- **`@granit/react-ui-geocoding`** (this package) — the styled components below.

## Components

- **`AddressAutocompleteInput`** — accessible (WAI-ARIA combobox) address
  typeahead. Debounced, cancels in-flight requests, and degrades to a plain text
  input when no `GeocodingProvider` is in scope or the endpoint is absent (404).
- **`AddressPrecisionBadge`** — read-only badge surfacing how precisely an address
  was geocoded (rooftop / street / locality).

## i18n

Ships the `geocoding` i18next namespace bundles (`geocodingTranslationsEn`,
`geocodingTranslationsFr`) and the `I18N_NAMESPACE` constant. Register the bundles
on your i18n instance:

```ts
i18n.addResourceBundle('en', 'geocoding', geocodingTranslationsEn);
i18n.addResourceBundle('fr', 'geocoding', geocodingTranslationsFr);
```
