# @granit/react-geocoding

React bindings for [`@granit/geocoding`](../geocoding) — a provider, React Query
hooks and a ready-to-use **address autocomplete** input.

## What's inside

- **`GeocodingProvider`** — supplies the Axios `client` + `basePath` (defaults to
  `/api/v1/geocoding`) to the hooks. Built on the shared `createConfigProvider`
  factory; `useGeocodingConfig` / `useOptionalGeocodingConfig` read it.
- **`useAddressSuggestions(search, options)`** — debounced typeahead hook.
  Returns ranked `suggestions` plus `isLoading` / `isError` / `isUnavailable`.
- **`useReverseGeocode(coordinate, options)`** — headless reverse-geocoding for a
  map pin-drop. Returns the nearest `address` (or `null` for a soft 404/422 miss).
- **`AddressAutocompleteInput`** — an accessible (WAI-ARIA combobox) text input
  that suggests addresses as you type and hands the structured components to the
  caller on select.
- **`AddressPrecisionBadge`** — a read-only badge for a reverse result's
  `precision` ("Exact location" / "Approximate location").

## Progressive enhancement

Geocoding is **never a hard dependency**. When no `GeocodingProvider` is in
scope, or the endpoint is not mapped (provider not installed → 404), the hooks
report `isUnavailable` and `AddressAutocompleteInput` silently behaves as a plain
text input — so a form keeps working with manual entry. Input is debounced
(~275 ms) before it reaches the shared, rate-limited provider, and in-flight
requests are cancelled when the text changes.

## Quick start

```tsx
import { GeocodingProvider, AddressAutocompleteInput } from '@granit/react-geocoding';

function BillingAddressField() {
  const [text, setText] = useState('');
  return (
    <AddressAutocompleteInput
      aria-label="Billing address"
      value={text}
      onValueChange={setText}
      onSelect={(s) => {
        // Fill the bound form fields from the structured components.
        form.setValue('line1', s.street ?? '');
        form.setValue('postalCode', s.postalCode ?? '');
        form.setValue('city', s.locality);
        form.setValue('country', s.country);
        if (s.latitude != null && s.longitude != null) {
          form.setValue('coordinate', { lat: s.latitude, lon: s.longitude });
        }
      }}
    />
  );
}

// Mount once, high in the tree (client comes from <GranitClientProvider>):
<GeocodingProvider config={{}}>
  <BillingAddressField />
</GeocodingProvider>;
```

### Reverse pin-drop

`@granit/react-map` is presentation-only (no interactive click callback), so the
reverse flow is intentionally headless — wire `useReverseGeocode` to whichever
map your app uses:

```tsx
const { address } = useReverseGeocode(pin); // pin: { lat, lon } | null
useEffect(() => {
  if (address) prefillForm(address);
}, [address]);
```

## i18n

User-facing copy lives in the `geocoding` namespace (brand-neutral). Register the
bundles with your i18n instance:

```ts
import { geocodingTranslationsEn, geocodingTranslationsFr } from '@granit/react-geocoding';

i18n.addResourceBundle('en', 'geocoding', geocodingTranslationsEn);
i18n.addResourceBundle('fr', 'geocoding', geocodingTranslationsFr);
```

## Testing

`@granit/react-geocoding/testing` ships MSW handlers and fixtures:

```ts
import {
  createGeocodingHandlers,
  createUnavailableGeocodingHandlers,
} from '@granit/react-geocoding/testing';
```
